'use client'

import ExportDocumentButton from '@/components/ExportDocumentButton';
import ProductListTable from '@/components/ProductListTable';
import SearchBar from '@/components/SearchBar';
import SupplierTable from '@/components/SupplierTable';
import { ListItem } from '@/interfaces/ListItem';
import { Supplier } from '@/interfaces/Supplier';
import { SupplierList } from '@/interfaces/SupplierList';
import {
    ActionType,
    ParamsType,
    RequestData
} from '@ant-design/pro-components';
import { AdProduct, ViewList } from '@icon-park/react';
import { ConfigProvider, Input, message, Segmented, SelectProps } from 'antd';
import axios from 'axios';
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
    // Lock for creating item
    const [creatingItem, setCreatingItem] = useState<boolean>();

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

    // Get list info
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

    //=== ProTable ===//

    // The main GET function. Table visualization depends on this function
    // Set the data source for the table. State of list products is handled by ProTable
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

    //=== UseEffects ===//

    useEffect(() => {
        getSupplierList();
    }, []);

    useEffect(() => {
        const element = document.getElementById('search');
        if (!supplierList || !dataSource || preventFocus || !element) return;

        element.focus({});
    }, [supplierList, dataSource, preventFocus]);


    // Trigger search on search query change
    useEffect(() => {
        if (searchTableQuery === undefined) return;
        console.log('searching', searchTableQuery);
        if (searchTableQuery.length == 0) setSearchTableQuery(undefined);
        setSearchingTable(true);
        actionRef.current?.reload();
    }, [searchTableQuery]);

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
                        // Search bar. The headache of this page
                        <SearchBar
                            supplierList={supplierList}
                            updateSupplierListName={updateSupplierListName}
                            tableActionRef={actionRef}
                            dataSource={dataSource}
                            setPreventFocus={setPreventFocus}
                            creatingItem={creatingItem}
                            setCreatingItem={setCreatingItem}
                            messageApi={messageApi}
                        />
                    )}
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
                            {/* Export to PDF button */}
                            <ExportDocumentButton
                                viewMode={viewMode}
                                dataSource={dataSource}
                                allSuppliers={allSuppliers}
                                supplierList={supplierList}
                                messageApi={messageApi}
                            />
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
                                supplierList={supplierList}
                                actionRef={actionRef}
                                dataSource={dataSource}
                                setDataSource={setDataSource}
                                fetchFunction={getListItems}
                                editableKeys={editableKeys}
                                setEditableRowKeys={setEditableRowKeys}
                                setPreventFocus={setPreventFocus}
                                loading={!dataSource || searchingTable}
                                messageApi={messageApi}
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