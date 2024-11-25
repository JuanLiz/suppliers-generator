
'use client'

import { ListItem } from '@/interfaces/ListItem';
import { Product } from '@/interfaces/Product';
import { SupplierList } from '@/interfaces/SupplierList';
import { EditOutlined, LoadingOutlined } from '@ant-design/icons';
import { CornerDownLeft, LeftSmall, Minus, PayCodeTwo, Plus, Search } from '@icon-park/react';
import { Alert, Button, ConfigProvider, Input, Select, SelectProps, Space, Spin, Typography } from 'antd';
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

interface ProductValue {
    label: any;
    value: string;
    title: string[];
}



export default function SearchBar({
    supplierList,
    updateSupplierListName,
    tableActionRef,
    dataSource,
    setPreventFocus,
    creatingItem,
    setCreatingItem,
    messageApi,
}: {
    supplierList: SupplierList,
    updateSupplierListName: (name: string) => void,
    tableActionRef: any,
    dataSource: readonly ListItem[] | undefined,
    setPreventFocus: (value: boolean) => void,
    creatingItem: boolean | undefined,
    setCreatingItem: (value: boolean) => void,
    messageApi: any,
}) {


    // Input mode for search. Barcode needs enter key handling
    const [inputMode, setInputMode] = useState<'barcode' | 'manual'>('manual');
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

    function DebounceSelect<
        ValueType extends { key?: string; label: React.ReactNode; value: string | number } = any,
    >(
        { fetchOptions, debounceTimeout, ...props }: DebounceSelectProps<ValueType>
    ) {
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

    // Create list item
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
                const response = await axios.post('/api/lists/' + supplierList.id + '/items', {
                    supplierListId: supplierList.id,
                    productId: selectedProduct?.value,
                    quantity: selectedQuantity,
                });
                messageApi.success('Producto agregado correctamente');
                setPreventFocus(false);
                tableActionRef.current?.reload();
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

    // Update list item if already exists
    async function updateListItem(key: any, listItem: ListItem) {
        console.log(key, listItem);
        listItem.updatedAt = undefined;
        try {
            await axios.put('/api/lists/' + supplierList.id + '/items/', listItem);
            messageApi.success('Producto actualizado correctamente');
            tableActionRef.current?.reload();
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

    // Effect for avoid multiple submissions on creating item on enter press
    useEffect(() => {
        if (creatingItem == undefined) return;
        createListItem();
    }, [creatingItem]);


    return (
        <ConfigProvider theme={{ token: { borderRadius: 36 }, }} >
            {/* Title */}
            <div className='flex items-center gap-2'>
                <ConfigProvider theme={{ token: { borderRadius: 8 }, }} >
                    <Link href='/'>
                        <Button
                            type='text'
                            icon={<LeftSmall theme="outline" size="24" fill="#0B1215" />}
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
            {/* Show alert first if screen is small */}
            <div className='flex flex-col-reverse lg:flex-col gap-6'>
                {/* Search bar */}
                <div className='flex flex-col md:flex-row items-center gap-4 flex-1'>
                    <Space.Compact size="large" className='w-full' direction={window.innerWidth < 640 ? 'vertical' : 'horizontal'}>
                        {/* Select between barcode and manual input */}
                        <Select
                            style={{
                                width: window.innerWidth < 640 ? '100%' : window.innerWidth < 1024 ? '28%' : '20%',
                                height: '3.5rem',
                                marginBottom: window.window.innerWidth < 640 ? '.5rem' : 0
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
                                width: window.innerWidth < 640 ? '100%' : window.innerWidth < 1024 ? '50%' : '70%',
                                height: '3.5rem',
                                marginBottom: window.window.innerWidth < 640 ? '.5rem' : 0
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
                            onClear={alreadyAdded ? () => setAlreadyAdded(false) : undefined}
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
                                width: window.innerWidth < 640 ? '100%' : window.innerWidth < 1024 ? '24%' : window.innerWidth < 1280 ? '22%' : '16%',
                                height: '3.5rem',
                                marginBottom: window.window.innerWidth < 640 ? '.5rem' : 0,
                            }}
                            className='mb-2 no-arrows'
                            min={1}
                            // Button for decrease as prefix
                            prefix={
                                <Button
                                    type='link'
                                    icon={<Minus theme="outline" size="24" fill="#7b7e83" />}
                                    onClick={() => setSelectedQuantity(selectedQuantity ? selectedQuantity - 1 : 1)}
                                />
                            }
                            suffix={
                                <Button
                                    type='link'
                                    icon={<Plus theme="outline" size="24" fill="#7b7e83" />}
                                    onClick={() => setSelectedQuantity(selectedQuantity ? selectedQuantity + 1 : 1)}
                                />
                            }
                            value={selectedQuantity}
                            placeholder={window.innerWidth >= 640 && window.innerWidth < 860 ? '#' : 'Cant.'}
                            // onChange={(e) => setSelectedQuantity(Number(e.target.value))}
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
                            width: window.window.innerWidth < 768 ? '100%' : 'auto',
                            height: '3.5rem',
                            marginBottom: window.window.innerWidth < 640 ? '.5rem' : 0
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
                {alreadyAdded && <div className='w-full lg:w-1/2 mx-auto'>
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
            </div>
            <div id='keyhint'
                className='mx-auto overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out max-h-0 opacity-0'
            >
                <p id='keyhint-child'
                    className='text-sm transform transition-transform duration-500 ease-in-out -translate-y-full'
                >
                    Presiona <Typography.Text keyboard>Enter</Typography.Text> para {alreadyAdded ? 'actualizar' : 'agregar'}
                </p>

            </div>
        </ConfigProvider>
    )
}