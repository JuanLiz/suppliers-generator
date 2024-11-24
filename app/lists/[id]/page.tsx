'use client'

import ProductListDocument from '@/components/ProductListDocument';
import ProductListTable from '@/components/ProductListTable';
import SupplierTable from '@/components/SupplierTable';
import { ListItem } from '@/interfaces/ListItem';
import { Product } from '@/interfaces/Product';
import { Supplier } from '@/interfaces/Supplier';
import { SupplierList } from '@/interfaces/SupplierList';
import { EditOutlined, LoadingOutlined } from '@ant-design/icons';
import {
    ActionType,
    ParamsType,
    RequestData
} from '@ant-design/pro-components';
import { AdProduct, CornerDownLeft, Download, FileSuccessOne, LeftSmall, PayCodeTwo, Search, ViewList } from '@icon-park/react';
import { pdf } from '@react-pdf/renderer';
import { Alert, Button, Checkbox, ConfigProvider, Input, message, Popover, Segmented, Select, SelectProps, Space, Spin, Typography } from 'antd';
import axios from 'axios';
import debounce from 'lodash/debounce';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from "react";

// For debounce search
export interface DebounceSelectProps<ValueType = any>
    extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
    fetchOptions: (search: string) => Promise<ValueType[]>;
    debounceTimeout?: number;
}


export default function ListPage(props: { params: { id: string; } }) {

    //=== States and refs===//

    //=== Search bar vars ===//
    // Supplier list data
    const [supplierList, setSupplierList] = useState<SupplierList>();
    // First focus on search input, after loading supplier list
    const [preventFocus, setPreventFocus] = useState<boolean>(false);
    // Input mode for search. Barcode needs enter key handling
    const [inputMode, setInputMode] = useState<'barcode' | 'manual'>('barcode');
    // Value for search input in barcode mode. Ref instead of state to real-time update
    const searchValueRef = useRef<any>(null);
    // Loading state for search (icon)
    const [searching, setSearching] = useState<boolean>(false);
    // Selected product for Select component
    const [selectedProduct, setSelectedProduct] = useState<ProductValue>();
    // If product is already added to list
    const [alreadyAdded, setAlreadyAdded] = useState<boolean>(false);
    // Switch input focus to quantity after selecting product
    const [switchInput, setSwitchInput] = useState<boolean>(false);
    // Quantity for selected product
    const [selectedQuantity, setSelectedQuantity] = useState<number>();
    // Lock for creating item
    const [creatingItem, setCreatingItem] = useState<boolean>();
    // Generate PDF loading state
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfSaveMode, setPdfSaveMode] = useState<'all' | 'suppliers'>('all');
    const [pdfShowSku, setPdfShowSku] = useState<boolean>(true);
    const [pdfSort, setPdfSort] = useState<'name' | 'suppliers' | 'sku'>('name');
    const [exportPdfVisible, setExportPdfVisible] = useState(false);

    const [messageApi, contextHolder] = message.useMessage();

    //=== List view vars ===//
    const [viewMode, setViewMode] = useState<'all' | 'suppliers'>('all');

    //=== ProTable ===//
    const [dataSource, setDataSource] = useState<readonly ListItem[]>();
    // Reference for table manipulation
    const actionRef = useRef<ActionType>();
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
    // Search bar query
    const [searchTableQuery, setSearchTableQuery] = useState<string>();
    // Searching state for table
    const [searchingTable, setSearchingTable] = useState<boolean>(false);

    async function getSupplierList() {
        try {
            const response = await axios.get('/api/lists/' + props.params.id);
            setSupplierList(response.data);
        } catch (error) {
            console.error(error);
        }

    }

    async function updateSupplierListName(name: string) {
        try {
            await axios.put(`/api/lists`, { id: props.params.id, name });
            getSupplierList();
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
            messageApi.error('Producto no encontrado').then(() => {
                searchValueRef.current = null;
                document.getElementById('search')?.focus();
            })
        } finally {
            setSearching(false);
        }
    }

    // Get product by manual search
    async function getProductList(search: string): Promise<ProductValue[]> {
        const isString = isNaN(Number(search));
        const searchQuery = `${isString ? 'name' : 'sku'}=${search}`;

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

        // If record already exists, redirect to update
        if (alreadyAdded) {
            const found = dataSource?.find((item) => item.productId === selectedProduct.value);
            if (!found) return;
            found.quantity = selectedQuantity;
            updateListItem(found.id, found);
        } else {
            try {
                const response = await axios.post('/api/lists/' + props.params.id + '/items', {
                    supplierListId: props.params.id,
                    productId: selectedProduct?.value,
                    quantity: selectedQuantity,
                });
                messageApi.success('Producto agregado correctamente');
                setPreventFocus(false);
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
    }

    function showKeyHint() {
        document.getElementById('keyhint')?.classList.add('max-h-20', 'opacity-100');
        document.getElementById('keyhint-child')?.classList.add('translate-y-0');
    }

    function hideKeyHint() {
        document.getElementById('keyhint')?.classList.remove('max-h-20', 'opacity-100');
        document.getElementById('keyhint-child')?.classList.remove('translate-y-0');
        document.getElementById('keyhint')?.classList.add('max-h-0', 'opacity-0');
        document.getElementById('keyhint-child')?.classList.add('-translate-y-full');
    }

    //=== ProTable ===//

    async function getListItems(params: ParamsType): Promise<Partial<RequestData<ListItem>>> {
        // params.size = params.pageSize;
        // params.page = params.current - 1;
        // params.role = params?.userRoleId;
        const response = await axios.get("/api/lists/" + props.params.id + "/items")
        // Check if a search query is present
        if (searchTableQuery && searchTableQuery.length > 0) {
            const filteredData = response.data.filter((item: ListItem) => {
                return item.product.name.toLowerCase().includes(searchTableQuery.toLowerCase())
                    || item.product.sku.toString().includes(searchTableQuery.toLowerCase());
            });
            setPreventFocus(true);
            setSearchingTable(false);
            return {
                data: filteredData,
                success: true,
                total: filteredData.length
            };
        }
        setPreventFocus(true);
        setSearchingTable(false);
        return {
            data: response.data,
            success: true,
            total: response.data.length
        };
    }

    // Get unique suppliers from dataset. Using memo
    const allSuppliers = useMemo(() => {
        if (!dataSource) return;
        const supplierMap = new Map<string, Supplier>()
        dataSource.forEach((item) => {
            if (item.product.supplier && !supplierMap.has(item.product.supplier.id)) {
                supplierMap.set(item.product.supplier.id, item.product.supplier)
            }
        })
        return Array.from(supplierMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    }, [dataSource])

    async function updateListItem(key: any, listItem: ListItem) {
        console.log(key, listItem);
        listItem.updatedAt = undefined;
        try {
            await axios.put('/api/lists/' + props.params.id + '/items/', listItem);
            // For already added products
            setPreventFocus(!alreadyAdded);
            messageApi.success('Producto actualizado correctamente');
            actionRef.current?.reload();
            setSelectedProduct(undefined);
            setSelectedQuantity(undefined);
            // For already added products
            setCreatingItem(false);
            setAlreadyAdded(false);
            document.getElementById('search')?.focus();
        } catch (error) {
            console.error(error);
            messageApi.error('Error al actualizar el producto');
        }
    }


    async function deleteListItem(id: string) {
        try {
            await axios.delete('/api/lists/' + props.params.id + '/items/' + id);
            setPreventFocus(true);
            messageApi.success('Producto eliminado correctamente');
            actionRef.current?.reload();
        } catch (error) {
            console.error(error);
            messageApi.error('Error al eliminar el producto');
        }
    }

    //=== PDF Generation ===//

    async function generatePdf() {
        setIsGeneratingPdf(true);
        if (!dataSource) return;
        try {
            const blob = await pdf(
                <ProductListDocument
                    mode={pdfSaveMode}
                    dataSource={dataSource}
                    sort={pdfSort}
                    showSku={pdfShowSku}
                    suppliers={allSuppliers}
                />
            ).toBlob()
            setExportPdfVisible(false);
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${supplierList?.name}.pdf`
            link.click()
            URL.revokeObjectURL(url)
            messageApi.success('PDF generado correctamente');
        } catch (error) {
            console.error('Error generating PDF:', error)
            messageApi.error('Error al generar el PDF');
        }
        setIsGeneratingPdf(false)
    }



    //=== UseEffects ===//

    useEffect(() => {
        getSupplierList();
    }, []);

    useEffect(() => {
        const element = document.getElementById('search');
        if (!supplierList || !dataSource || preventFocus || !element) return;

        element.focus({});
    }, [supplierList, dataSource, preventFocus]);


    // Focus to quantity and set default to 1 on selected product
    useEffect(() => {
        if (!selectedProduct) return;
        // Search if product is already added
        const found = dataSource?.find((item) => item.productId === selectedProduct.value);
        if (found) {
            setAlreadyAdded(true);
            setSelectedQuantity(found.quantity);

        } else {
            setAlreadyAdded(false);
            document.getElementById('search')?.blur();
            setSelectedQuantity(1);
            setSwitchInput(true);
        }
    }, [selectedProduct, alreadyAdded]);

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

    // Trigger search on search query change
    useEffect(() => {
        if (searchTableQuery === undefined) return;
        console.log('searching', searchTableQuery);
        if (searchTableQuery.length == 0) setSearchTableQuery(undefined);
        setSearchingTable(true);
        actionRef.current?.reload();
    }, [searchTableQuery]);

    // Change pdf options on mode change
    useEffect(() => {
        setPdfSaveMode(viewMode);
    }, [viewMode]);

    return (
        <div className="bg-gray-200/70 min-h-screen">
            {contextHolder}
            <main className="flex flex-col max-w-screen-xl mx-auto p-4 lg:p-12 gap-6">
                {/* Search card */}
                <div className="p-8 rounded-xl bg-white flex flex-col gap-4">
                    {!supplierList ? (
                        <div className="animate-pulse flex flex-col gap-4">
                            <div className="w-full md:w-1/6 h-8 bg-gray-200 rounded-lg"></div>
                            <div className='flex flex-col md:flex-row gap-4'>
                                <div className="w-full h-14 bg-gray-200 rounded-2xl"></div>
                                <div className="w-full h-14 md:size-14 bg-gray-200 rounded-2xl"></div>
                            </div>
                        </div>
                    ) : (
                        <ConfigProvider theme={{ token: { borderRadius: 36 }, }} >
                            <div className='flex items-center gap-2'>
                                <ConfigProvider theme={{ token: { borderRadius: 8 }, }} >
                                    <Link href='/'>
                                        <Button
                                            type='text'
                                            icon={<LeftSmall theme="outline" size="24" fill="#0B1215" />}
                                        // onClick={() => history.back()}
                                        >
                                        </Button>
                                    </Link>
                                    <Typography.Title
                                        level={3}
                                        className="text-2xl font-bold group"
                                        style={{
                                            marginBottom: 0,
                                            lineHeight: '2rem',
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                        }}
                                        editable={{
                                            onChange: (name) => {
                                                updateSupplierListName(name);
                                            },
                                            icon: (
                                                <div className="lg:hidden lg:group-hover:block ms-1">
                                                    <EditOutlined style={{ color: '#7b7e83', fontSize: '1.2rem' }} />
                                                </div>
                                            ),
                                            triggerType: ['icon', 'text'],
                                            tooltip: 'Editar nombre',
                                        }}
                                    >
                                        {supplierList.name}
                                    </Typography.Title>
                                </ConfigProvider>
                            </div>
                            <div className='flex flex-col md:flex-row items-center gap-4 flex-1'>
                                <Space.Compact size="large" className='w-full' direction={screen.width < 640 ? 'vertical' : 'horizontal'}>
                                    {/* Select between barcode and manual input */}
                                    <Select
                                        style={{
                                            width: screen.width < 640 ? '100%' : screen.width < 1024 ? '28%' : '20%',
                                            height: '3.5rem',
                                            marginBottom: window.screen.width < 640 ? '.5rem' : 0
                                        }}
                                        className='shadow-sm rounded-xl w-full mb-2'
                                        size='large'
                                        value={inputMode}
                                        onChange={(value) => setInputMode(value)}
                                        options={[
                                            {
                                                label: (
                                                    <div className='flex gap-1.5 items-center'>
                                                        <PayCodeTwo theme="outline" strokeWidth={3} size="24" fill="#0B1215" />
                                                        <span className='hidden sm:flex xl:hidden'>Código</span>
                                                        <span className='flex sm:hidden xl:flex'>Código de barras</span>
                                                    </div>
                                                ),
                                                value: 'barcode'
                                            },
                                            {
                                                label: (
                                                    <div className='flex gap-1.5 items-center'>
                                                        <Search theme="outline" strokeWidth={3} size="24" fill="#0B1215" />
                                                        <span className='hidden sm:flex xl:hidden'>Búsqueda</span>
                                                        <span className='flex sm:hidden xl:flex'>Búsqueda manual</span>
                                                    </div>
                                                ),
                                                value: 'manual'
                                            }
                                        ]}
                                    />

                                    <DebounceSelect
                                        className='shadow-sm rounded-xl w-full mb-2'
                                        size='large'
                                        id='search'
                                        style={{
                                            width: screen.width < 640 ? '100%' : screen.width < 1024 ? '50%' : '70%',
                                            height: '3.5rem',
                                            marginBottom: window.screen.width < 640 ? '.5rem' : 0
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
                                                    if (isNaN(Number(searchValueRef.current))) {
                                                        messageApi.error('Código de barras inválido');
                                                        searchValueRef.current = null;
                                                        setSearching(false);
                                                        document.getElementById('search')?.focus();
                                                    } else { getScannedProduct() }

                                                }
                                            });

                                            //Detect right arrow for switch to quantity
                                            e.target.addEventListener('keydown', (e: any) => {
                                                if (e.keyCode === 39) {
                                                    e.target.blur();
                                                    document.getElementById('quantity')?.focus();
                                                }
                                            });
                                        }}
                                        allowClear
                                    />
                                    <Input
                                        type='number'
                                        id='quantity'
                                        style={{
                                            width: screen.width < 640 ? '100%' : screen.width < 1024 ? '22%' : '10%',
                                            height: '3.5rem',
                                            marginBottom: window.screen.width < 640 ? '.5rem' : 0
                                        }}
                                        className='mb-2'
                                        min={1}
                                        value={selectedQuantity}
                                        placeholder='Cant.'
                                        onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                                        onFocus={(e) => {
                                            e.target.select()
                                            if (selectedProduct && selectedQuantity) showKeyHint();
                                            // Detect enter for submit
                                            e.target.addEventListener('keydown', (e: any) => {
                                                if (e.keyCode === 13 && !creatingItem && selectedProduct && selectedQuantity) {
                                                    setCreatingItem(true);
                                                }
                                            });
                                            // Detect left arrow for switch to search
                                            e.target.addEventListener('keydown', (e: any) => {
                                                if (e.keyCode === 37) {
                                                    e.target.blur();
                                                    document.getElementById('search')?.focus();
                                                }
                                            });

                                            //Detect right arrow for switch to search
                                            e.target.addEventListener('keydown', (e: any) => {
                                                if (e.keyCode === 39) {
                                                    e.target.blur();
                                                    document.getElementById('searchBtn')?.focus();
                                                }
                                            });
                                        }}
                                        onBlur={(e) => hideKeyHint()}

                                    />
                                </Space.Compact>
                                <div className='flex gap-0 items-center flex-1'>
                                </div>
                                <Button
                                    style={{
                                        width: window.screen.width < 768 ? '100%' : 'auto',
                                        height: '3.5rem',
                                        marginBottom: window.screen.width < 640 ? '.5rem' : 0
                                    }}
                                    id='searchBtn'
                                    type="primary"
                                    size='large'
                                    block
                                    // shape="circle"
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
                                    onFocus={(e) => {
                                        if (selectedProduct && selectedQuantity) showKeyHint();

                                        // Detect left arrow for switch to quantity
                                        e.target.addEventListener('keydown', (e: any) => {
                                            if (e.keyCode === 37) {
                                                e.target.blur();
                                                document.getElementById('quantity')?.focus();
                                            }
                                        });

                                    }}
                                    onBlur={(e) => hideKeyHint()}
                                >
                                    <p className='flex md:hidden'>Agregar</p>
                                </Button>
                            </div>
                            {alreadyAdded && <div className='lg:w-1/2 mx-auto'>
                                <Alert
                                    message={<span className='font-semibold'>El producto ya está en la lista</span>}
                                    className='w-auto'
                                    description={
                                        <span>
                                            Puedes modificar la cantidad existente. <b>El registro no se duplicará. </b> <br />
                                            Si deseas agregar un nuevo producto, por favor escanea o busca otro producto.
                                        </span>
                                    }
                                    type="warning"
                                    showIcon
                                />
                            </div>}
                            <div id='keyhint'
                                className='mx-auto overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out max-h-0 opacity-0'
                            >
                                <p id='keyhint-child'
                                    className='text-sm transform transition-transform duration-500 ease-in-out -translate-y-full'
                                >
                                    Presiona <Typography.Text keyboard>Enter</Typography.Text> para {alreadyAdded ? 'actualizar' : 'agregar'}
                                </p>

                            </div>
                        </ConfigProvider>)}
                </div>
                {/* List card */}
                <div className='flex flex-col gap-8 p-8 bg-white rounded-xl min-h-[26rem]'>
                    {!supplierList ? (
                        <div className="animate-pulse flex flex-col gap-12">
                            <div className="w-full md:w-1/6 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="w-full h-80 bg-gray-200 rounded-2xl"></div>

                        </div>
                    ) : (<>
                        <div className='w-full flex flex-col md:flex-row md:items-center justify-between gap-4'>
                            <h2 className='font-bold text-2xl mb-1'>Productos agregados</h2>
                            <Popover
                                content={
                                    <div className='flex flex-col gap-4 w-96 md:w-[28rem] px-3 py-4' >
                                        <h3 className='font-bold text-lg'>Opciones de generación</h3>
                                        <div className='flex flex-col gap-1'>

                                            <Segmented
                                                value={pdfSaveMode}
                                                block
                                                onChange={(value: 'all' | 'suppliers') => setPdfSaveMode(value)}
                                                options={[
                                                    {
                                                        label: 'Todos los productos',
                                                        value: 'all'
                                                    },
                                                    {
                                                        label: 'Por proveedor',
                                                        value: 'suppliers'
                                                    }
                                                ]}
                                            />
                                        </div>
                                        {pdfSaveMode === 'all' && <div className='flex flex-col gap-1'>
                                            <span className='text-sm font-semibold'>Ordenar por</span>
                                            <Segmented
                                                value={pdfSort}
                                                block
                                                onChange={(value: 'name' | 'suppliers' | 'sku') => setPdfSort(value)}
                                                options={[
                                                    {
                                                        label: 'Producto',
                                                        value: 'name'
                                                    },
                                                    {
                                                        label: 'Proveedor',
                                                        value: 'suppliers'
                                                    },
                                                    {
                                                        label: 'Código',
                                                        value: 'sku'
                                                    }
                                                ]}
                                            />
                                        </div>}
                                        <div className='flex gap-2 items-center'>
                                            <Checkbox
                                                checked={pdfShowSku}
                                                onChange={(e) => setPdfShowSku(e.target.checked)}
                                            >
                                                <span className='font-semibold'>Mostrar códigos</span>
                                            </Checkbox>
                                        </div>
                                        <Button
                                            type='primary'
                                            htmlType='submit'
                                            className='mt-4'
                                            block
                                            loading={isGeneratingPdf}
                                            onClick={generatePdf}
                                            icon={<Download theme="outline" strokeWidth={4} size="16" fill="#ffffff" />}
                                        >
                                            Descargar
                                        </Button>
                                    </div>
                                }
                                placement={screen.width < 640 ? 'bottom' : 'bottomRight'}
                                arrow={false}
                                trigger="click"
                                open={exportPdfVisible}
                                onOpenChange={(visible) => setExportPdfVisible(visible)}
                            >
                                <Button
                                    type='primary'
                                    size='large'
                                    style={{
                                        height: '3rem',
                                        borderRadius: '1rem',
                                    }}
                                    disabled={!dataSource || dataSource.length < 1}
                                    icon={
                                        <FileSuccessOne
                                            theme="outline"
                                            strokeWidth={4}
                                            size="24"
                                            fill={dataSource && dataSource.length > 0 ? "#ffffff" : "#7b7e83"}
                                        />
                                    }
                                >
                                    Generar PDF
                                </Button>
                            </Popover>
                        </div>
                        <div className='flex flex-col md:flex-row gap-6 md:items-center justify-between'>
                            {/*Search bar */}
                            <div className='flex gap-4 items-center md:w-1/3'>
                                <ConfigProvider theme={{
                                    token: { borderRadius: 10, fontSize: 13 }
                                }}
                                >
                                    <Input.Search
                                        placeholder="Busca por nombre o código"
                                        allowClear
                                        size='large'
                                        // variant='filled'
                                        enterButton
                                        loading={searchingTable}
                                        onSearch={setSearchTableQuery}
                                        onClear={() => setSearchTableQuery('')}
                                    />
                                </ConfigProvider>
                            </div>

                            <Segmented
                                value={viewMode}
                                className='w-min'
                                onChange={(value: 'all' | 'suppliers') => setViewMode(value)}
                                options={[
                                    {
                                        label: (
                                            <div className='flex gap-1 items-center py-1.5 px-2.5'>
                                                <ViewList
                                                    theme="outline"
                                                    strokeWidth={viewMode === 'all' ? 4 : 3}
                                                    size="22"
                                                    fill="#0B1215"
                                                />
                                                <span className={viewMode === 'all' ? 'font-semibold' : 'font-regular'}>
                                                    Todos
                                                </span>
                                            </div>
                                        ),
                                        value: 'all'
                                    },
                                    {
                                        label: (
                                            <div className='flex gap-1 items-center py-1.5 px-2.5'>
                                                <AdProduct
                                                    theme="outline"
                                                    strokeWidth={viewMode === 'suppliers' ? 4 : 3}
                                                    size="22"
                                                    fill="#0B1215"
                                                />
                                                <span className={viewMode === 'suppliers' ? 'font-semibold' : 'font-regular'}>
                                                    Proveedores
                                                </span>
                                            </div>
                                        ),
                                        value: 'suppliers'
                                    }
                                ]}
                            />
                        </div>
                        <div className={viewMode === 'all' ? '' : 'hidden'}>
                            <ProductListTable
                                actionRef={actionRef}
                                dataSource={dataSource}
                                setDataSource={setDataSource}
                                fetchFunction={getListItems}
                                updateFunction={updateListItem}
                                deleteFunction={deleteListItem}
                                editableKeys={editableKeys}
                                setEditableRowKeys={setEditableRowKeys}
                                setPreventFocus={setPreventFocus}
                                loading={!dataSource || searchingTable}
                            />
                        </div>
                        <div className={`w-full flex-col gap-4 ${viewMode === 'suppliers' ? 'flex' : 'hidden'}`}>
                            {allSuppliers?.map((supplier) => (
                                <SupplierTable
                                    key={supplier.id}
                                    supplier={supplier.name}
                                    data={dataSource?.filter((item) => item.product.supplier?.id === supplier.id) || []}
                                />
                            ))}
                        </div>
                    </>)}

                </div>
            </main >
        </div >

    );
}