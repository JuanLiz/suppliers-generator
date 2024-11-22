'use client'

import { ListItem } from '@/interfaces/ListItem';
import { SupplierList } from '@/interfaces/SupplierList';
import {
    ActionType,
    EditableProTable,
    ParamsType,
    ProColumns,
    RequestData
} from '@ant-design/pro-components';
import { Plus, Search } from '@icon-park/react';
import { Button, Input } from '@mui/joy';
import axios from 'axios';
import { useEffect, useRef, useState } from "react";



export default function ListPage(props: { params: { id: string; } }) {

    const [supplierList, setSupplierList] = useState<SupplierList>();


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
            title: 'Producto',
            dataIndex: 'name',
            search: true,
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


    useEffect(() => {
        getSupplierList();
    }, []);

    return (
        <div className="bg-gray-200/70 w-screen min-h-screen">
            <main className="flex flex-col max-w-screen-xl mx-auto p-4 lg:p-12 gap-6">
                {/* Search card */}
                <div className="p-8 rounded-xl bg-white flex flex-col gap-4">
                    {supplierList && <h1 className="text-2xl font-bold">{supplierList.name}</h1>}
                    <div className="flex items-center gap-4">
                        <div className='flex gap-0 items-center flex-1'>
                            <Input
                                type="text"
                                placeholder="Escanea, escribe el código de barras o busca por nombre"
                                className="w-full h-14"
                                size='lg'
                                sx={{
                                    borderRadius: '1.2rem 0 0 1.2rem',
                                    border: '2px solid --tw-border-opacity',
                                    fontSize: '1rem',
                                }}
                                startDecorator={<Search theme="outline" size="24" fill="#0B1215" />}

                            />
                            <Input
                                type='number'
                                placeholder='Cantidad'
                                size='lg'
                                className="h-14"
                                sx={{
                                    fontSize: '1rem',
                                    border: '2px solid --tw-border-opacity',
                                    borderInlineStart: 'none',
                                    borderRadius: '0 1.2rem 1.2rem 0',
                                    '&:hover': { bgcolor: 'transparent' }
                                }}
                            />
                        </div>
                        <Button
                            variant="solid"
                            size="lg"
                            className='size-14'
                            sx={{
                                borderRadius: '90rem'
                            }}
                        >
                            <Plus theme="outline" size="24" fill="#0B1215" />
                        </Button>
                    </div>
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
            </main>
        </div>

    );
}