'use client'

import { ListItem } from '@/interfaces/ListItem';
import { Product } from '@/interfaces/Product';
import { SupplierList } from '@/interfaces/SupplierList';
import { LoadingOutlined } from '@ant-design/icons';
import {
    ActionType,
    EditableProTable,
    ParamsType,
    ProColumns,
    RequestData
} from '@ant-design/pro-components';
import { CornerDownLeft, PayCodeTwo, Search } from '@icon-park/react';
import { Button, ConfigProvider, Input, message, Select, SelectProps, Space, Spin, Typography } from 'antd';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useRef, useState } from "react";

// For debounce search
export interface DebounceSelectProps<ValueType = any>
    extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
    fetchOptions: (search: string) => Promise<ValueType[]>;
    debounceTimeout?: number;
}


export default function ListPage(props: { params: { id: string; } }) {

    //=== States and refs===//

    const [supplierList, setSupplierList] = useState<SupplierList>();

    // Search bar
    const [inputMode, setInputMode] = useState<'barcode' | 'manual'>('barcode');
    // Value for search input in barcode mode
    const searchValueRef = useRef<any>(null);
    const [searching, setSearching] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductValue>();
    const [switchInput, setSwitchInput] = useState<boolean>(false);
    const [selectedQuantity, setSelectedQuantity] = useState<number>();
    const [creatingItem, setCreatingItem] = useState<boolean>();

    const [messageApi, contextHolder] = message.useMessage();

    //=== ProTable stuff ===//
    const [dataSource, setDataSource] = useState<readonly ListItem[]>([]);
    // Reference for table manipulation
    const actionRef = useRef<ActionType>();
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);

    async function getSupplierList() {
        try {
            const response = await axios.get('/api/lists/' + props.params.id);
            setSupplierList(response.data);
        } catch (error) {
            console.error(error);
        }

    }

    //=== Methods ===//


    //=== Search bar methods ===//
    interface ProductValue {
        label: any;
        value: string;
        title: string[];
    }

    function DebounceSelect<
        ValueType extends { key?: string; label: React.ReactNode; value: string | number } = any,
    >({ fetchOptions, debounceTimeout, ...props }: DebounceSelectProps<ValueType>) {
        const [fetching, setFetching] = useState(false);
        const [options, setOptions] = useState<ValueType[]>([]);
        const fetchRef = useRef(0);

        const debounceFetcher = useMemo(() => {
            const loadOptions = (value: string) => {
                console.log('fetching', value);
                fetchRef.current += 1;
                const fetchId = fetchRef.current;
                setOptions([]);
                setFetching(true);

                // Return on empty search
                if (value.length < 1) return;

                fetchOptions(value).then((newOptions) => {
                    if (fetchId !== fetchRef.current) {
                        // for fetch callback order
                        return;
                    }

                    setOptions(newOptions);
                    setFetching(false);
                });
            };

            return debounce(loadOptions, debounceTimeout);
        }, [fetchOptions, debounceTimeout]);

        return (
            <Select
                labelInValue
                filterOption={false}
                onSearch={(value) => {
                    if (inputMode === 'barcode') {
                        searchValueRef.current = value;
                    } else {
                        debounceFetcher(value);
                    }
                }}
                {...props}
                options={options}
            />
        );
    }


    // Get product scanned by barcode
    async function getScannedProduct() {
        setSearching(true);
        try {
            const response = await axios.get(`/api/products?sku=${searchValueRef.current}`);
            setSearching(false);
            const product = {
                label: (
                    <div className="flex flex-col gap-1 leading-none">
                        <div className='flex gap-1 items-center'>
                            <PayCodeTwo theme="outline" size="12" fill="#9ca3af" />
                            <span className="text-gray-400 text-xs">
                                {response.data.sku} - {response.data.supplier?.name}
                            </span>
                        </div>
                        <span>{response.data.name}</span>
                    </div>
                ),
                value: response.data.id,
                // Using title for store SKU and supplier name for search
                title: [response.data.sku, response.data.name, response.data.supplier?.name],
            }
            setSelectedProduct(product);
            searchValueRef.current = null;

        } catch (error) {
            console.error(error);
            messageApi.error('Producto no encontrado', .75, () => {
                document.getElementById('search')?.focus();
            });
        } finally {
            setSearching(false);
        }
    }

    // Get product by manual search
    async function getProductList(search: string): Promise<ProductValue[]> {
        var isString = isNaN(Number(search));
        var searchQuery = `${isString ? 'name' : 'sku'}=${search}`;

        try {
            const response = await axios.get(`/api/products?${searchQuery}`);
            return isString ? response.data.map((product: Product) => {
                return {
                    label: (
                        <div className="flex flex-col gap-1 leading-none">
                            <div className='flex gap-1 items-center'>
                                <PayCodeTwo theme="outline" size="12" fill="#9ca3af" />
                                <span className="text-gray-400 text-xs">
                                    {product.sku} - {product.supplier?.name}
                                </span>
                            </div>
                            <span>{product.name}</span>
                        </div>
                    ),
                    value: product.id,
                    // Using title for store SKU and supplier name for search
                    title: [product.sku, product.name, product.supplier?.name],
                }
            }) : [{
                label: (<div className="flex flex-col gap-1 leading-none">
                    <div className='flex gap-1 items-center'>
                        <PayCodeTwo theme="outline" size="12" fill="#9ca3af" />
                        <span className="text-gray-400 text-xs">
                            {response.data.sku} - {response.data.supplier?.name}
                        </span>
                    </div>
                    <span>{response.data.name}</span>
                </div>),
                value: response.data.id,
                // Using title for store SKU and supplier name for search
                title: [response.data.sku, response.data.name, response.data.supplier?.name],
            }]
        } catch (error) {
            console.error(error);
            return [];
        }

    }

    async function createListItem() {
        if (!selectedProduct || !selectedQuantity) return;
        try {
            const response = await axios.post('/api/lists/' + props.params.id + '/items', {
                supplierListId: props.params.id,
                productId: selectedProduct?.value,
                quantity: selectedQuantity,
            });
            messageApi.success('Producto agregado correctamente');
            actionRef.current?.reload();
            setSelectedProduct(undefined);
            setSelectedQuantity(undefined);
            document.getElementById('search')?.focus();
        } catch (error) {
            console.error(error);
            messageApi.error('Error al agregar el producto');
        } finally {
            setCreatingItem(false);
        }

    }


    //=== ProTable ===//

    async function getListItems(params: ParamsType): Promise<Partial<RequestData<ListItem>>> {
        // params.size = params.pageSize;
        // params.page = params.current - 1;
        // params.role = params?.userRoleId;
        const response = await axios.get("/api/lists/" + props.params.id + "/items")
        return {
            data: response.data,
            success: true,
            total: response.data.length
        };
    }

    const columns: ProColumns<ListItem>[] = [
        {
            title: 'Código',
            dataIndex: 'sku',
            width: '5%',
            editable: false,
            render: (text, record, index, action) => {
                return <span className='font-bold'>{record.product.sku}</span>
            }
        },
        {
            title: 'Cantidad',
            dataIndex: 'quantity',
            width: '5%',
            editable: false,
            align: 'right',
            render: (text, record, index, action) => {
                return <span className='font-bold text-end'>{record.quantity}</span>
            }
        },
        {
            title: 'Producto',
            dataIndex: 'name',
            search: false,
            width: '30%',
            editable: false,
            render: (text, record, index, action) => {
                return <span>{record.product.name}</span>
            }
        },
        {
            title: 'Proveedor',
            dataIndex: 'provider.name',
            width: '10%',
            editable: false,
            render: (text, record, index, action) => {
                return <span>{record.product.supplier?.name}</span>
            }
        },
        // {
        //     title: 'Rol',
        //     dataIndex: 'userRoleId',
        //     width: '15%',
        //     filters: true,
        //     valueType: 'select',
        //     request: async (): Promise<RequestOptionsType[]> => {
        //         return userRoles?.map((role) => {
        //             return {
        //                 label: role.name,
        //                 value: role.id,
        //             }
        //         }) ?? [];
        //     },
        //     render: (text, record, index, action) => {
        //         return <Tag color={record.userRole?.role === 'ADMIN'
        //             ? 'red' :
        //             record.userRole?.role === 'INSTRUCTOR'
        //                 ? 'purple'
        //                 : 'blue'}>
        //             {record.userRole?.name}
        //         </Tag>
        //     },
        //     formItemProps: {
        //         rules: [{ required: true, message: 'El campo es obligatorio', },],
        //     }
        // },
        {
            title: 'Novedad',
            dataIndex: 'comment',
            width: '15%',
            valueType: 'date',
            search: false,
            readonly: true
        },
        // {
        //     title: '',
        //     valueType: 'option',
        //     width: '10%',
        //     render: (text, record, _, action) => [
        //         <Dropdown key={`drop${record.id}-${_}`} menu={{
        //             items: [
        //                 {
        //                     key: `editable-${_}`,
        //                     label: (
        //                         <div className="flex gap-2">
        //                             {/* <EditOutlined color="black" /> */}
        //                             <span>Editar</span>
        //                         </div>
        //                     ),
        //                     onClick: () => {
        //                         // action?.startEditable?.(record.id);
        //                     }
        //                 },
        //                 {
        //                     label: (
        //                         <div className="flex gap-2">
        //                             {/* <DeleteOutlined /> */}
        //                             <span>Eliminar</span>
        //                         </div>
        //                     ),
        //                     key: `delete-${_}`,
        //                     danger: true,
        //                     onClick: () => {
        //                         // setDeletedUser(record);
        //                         // setDeleteUserModalVisible(true);
        //                     }
        //                 },
        //             ]

        //         }} trigger={['click']}>
        //             <a onClick={(e) => e.preventDefault()} className="rounded-full hover:bg-gray-100 px-1.5 pt-1 cursor-pointer">
        //                 {/* <EllipsisOutlined className="rotate-90 text-xl" style={{ color: 'black' }} /> */}
        //             </a>
        //         </Dropdown>
        //     ],
        // },
    ];


    //=== UseEffects ===//

    useEffect(() => {
        getSupplierList();
    }, []);

    useEffect(() => {
        const element = document.getElementById('search');
        if (!supplierList || !dataSource || !element) return;
        element.focus({});
    }, [supplierList, dataSource]);


    // Focus to quantity and set default to 1 on selected product
    useEffect(() => {
        if (!selectedProduct) return;
        document.getElementById('search')?.blur();
        setSelectedQuantity(1);
        setSwitchInput(true);
    }, [selectedProduct]);

    useEffect(() => {
        if (!selectedQuantity && !switchInput) return;
        setSwitchInput(false);
        const element = document.getElementById('quantity') as HTMLInputElement;
        if (!element || document.activeElement == element) return;
        element.focus({});
        element.select();
    }, [selectedQuantity, switchInput]);

    useEffect(() => {
        if (creatingItem == undefined) return;
        createListItem();
    }, [creatingItem]);

    return (
        <div className="bg-gray-200/70 w-screen min-h-screen">
            {contextHolder}
            <main className="flex flex-col max-w-screen-xl mx-auto p-4 lg:p-12 gap-6">
                {/* Search card */}
                <div className="p-8 rounded-xl bg-white flex flex-col gap-4">
                    <ConfigProvider
                        theme={{
                            token: {
                                borderRadius: 36
                            },
                        }}
                    >
                        {supplierList && <h1 className="text-2xl font-bold">{supplierList.name}</h1>}

                        <div className='flex items-center gap-4 flex-1'>
                            <Space.Compact size="large" className='w-full'>
                                {/* Select between barcode and manual input */}
                                <Select
                                    style={{
                                        width: '20%',
                                        height: '3.5rem'
                                    }}
                                    className='shadow-sm rounded-xl w-1/4'
                                    size='large'
                                    value={inputMode}
                                    onChange={(value) => setInputMode(value)}
                                    options={[
                                        {
                                            label: (
                                                <div className='flex gap-1.5 items-center'>
                                                    <PayCodeTwo theme="outline" strokeWidth={3} size="24" fill="#0B1215" />
                                                    <span>Código de barras</span>
                                                </div>
                                            ),
                                            value: 'barcode'
                                        },
                                        {
                                            label: (
                                                <div className='flex gap-1.5 items-center'>
                                                    <Search theme="outline" strokeWidth={3} size="24" fill="#0B1215" />
                                                    <span>Búsqueda manual</span>
                                                </div>
                                            ),
                                            value: 'manual'
                                        }
                                    ]}
                                />

                                <DebounceSelect
                                    className='shadow-sm rounded-xl w-full'
                                    size='large'
                                    id='search'
                                    style={{
                                        width: '70%',
                                        height: '3.5rem'
                                    }}
                                    suffixIcon={null}
                                    placeholder={
                                        inputMode === 'barcode'
                                            ? 'Escanea el código de barras'
                                            : 'Escribe el código o nombre del producto'
                                    }
                                    showSearch
                                    notFoundContent={null}
                                    fetchOptions={getProductList}
                                    debounceTimeout={inputMode === 'barcode' ? 100 : 800}
                                    value={selectedProduct}
                                    onChange={(value) => {
                                        setSelectedProduct(value as ProductValue);
                                    }}
                                    onFocus={(e) => {
                                        //Detect enter press
                                        e.target.addEventListener('keydown', (e: any) => {
                                            if (e.keyCode === 13 && inputMode === 'barcode'
                                                && document.activeElement?.id != 'quantity') {
                                                setSelectedProduct(undefined);
                                                getScannedProduct();
                                            }
                                        });
                                    }}
                                    allowClear
                                />
                                <Input
                                    type='number'
                                    id='quantity'
                                    style={{
                                        width: '10%',
                                        height: '3.5rem'
                                    }}
                                    min={1}
                                    value={selectedQuantity}
                                    placeholder='Cant.'
                                    onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                                    onFocus={(e) => {
                                        e.target.select()
                                        if (selectedProduct && selectedQuantity) {
                                            document.getElementById('keyhint')?.classList.add('max-h-20', 'opacity-100');
                                            document.getElementById('keyhint-child')?.classList.add('translate-y-0');
                                        }
                                        // Detect enter for submit
                                        e.target.addEventListener('keydown', (e: any) => {
                                            if (e.keyCode === 13 && !creatingItem && selectedProduct && selectedQuantity) {
                                                setCreatingItem(true);
                                            }
                                        });
                                    }}
                                    onBlur={(e) => {
                                        document.getElementById('keyhint')?.classList.remove('max-h-20', 'opacity-100');
                                        document.getElementById('keyhint-child')?.classList.remove('translate-y-0');
                                        document.getElementById('keyhint')?.classList.add('max-h-0', 'opacity-0');
                                        document.getElementById('keyhint-child')?.classList.add('-translate-y-full');
                                    }}

                                />
                            </Space.Compact>
                            <div className='flex gap-0 items-center flex-1'>
                            </div>
                            <Button
                                style={{
                                    width: '3.79rem',
                                    height: '3.5rem'
                                }}
                                type="primary"
                                size='large'
                                shape="circle"
                                icon={searching
                                    ? <Spin indicator={
                                        <LoadingOutlined spin style={{
                                            color: selectedProduct && selectedQuantity ? "#ffffff" : "#cdd6e2"
                                        }} />
                                    } />
                                    : <CornerDownLeft
                                        theme="outline"
                                        size="24"
                                        fill={selectedProduct && selectedQuantity ? "#ffffff" : "#cdd6e2"}
                                    />
                                }
                                disabled={!selectedProduct || !selectedQuantity}
                                onClick={createListItem}
                                loading={creatingItem}
                            />
                        </div>
                        <div id='keyhint'
                            className='mx-auto overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out max-h-0 opacity-0'
                        >
                            <p id='keyhint-child'
                                className='text-sm transform transition-transform duration-500 ease-in-out -translate-y-full'
                            >
                                Presiona <Typography.Text keyboard>Enter</Typography.Text> para agregar
                            </p>

                        </div>
                    </ConfigProvider>
                </div>
                {/* Table card */}
                <div className='flex flex-col gap-8 p-8 bg-white rounded-xl'>
                    <h2 className='font-bold text-2xl'>Productos agregados</h2>
                    <EditableProTable<ListItem>
                        rowKey="id"
                        scroll={{
                            x: 960,
                        }}
                        className="-mt-4"
                        recordCreatorProps={false}
                        loading={!(dataSource.length > 0)}
                        columns={columns}
                        actionRef={actionRef}
                        request={getListItems}
                        value={dataSource}
                        onChange={setDataSource}
                        search={{
                            labelWidth: 'auto',
                            span: {
                                xs: 24,
                                sm: 12,
                                md: 12,
                                lg: 6,
                                xl: 6,
                                xxl: 6,
                            },
                        }}
                    // editable={{
                    //     type: 'multiple',
                    //     editableKeys,
                    //     // onSave: updateUser,
                    //     // onChange: setEditableRowKeys,
                    //     // saveText: <CheckOutlined className="text-lg" />,
                    //     // cancelText: <CloseOutlined className="text-lg" style={{ color: 'black' }} />,
                    //     deleteText: <span className="hidden"></span>,
                    // }}
                    />
                </div>
            </main >
        </div >

    );
}