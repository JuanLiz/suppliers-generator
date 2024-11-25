import { ListItem } from "@/interfaces/ListItem";
import { SupplierList } from "@/interfaces/SupplierList";
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { EditableProTable, ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm } from "antd";
import { MessageInstance } from "antd/es/message/interface";
import axios from "axios";

export default function ProductListTable(
    {
        supplierList,
        actionRef,
        dataSource,
        setDataSource,
        fetchFunction,
        editableKeys,
        setEditableRowKeys,
        setPreventFocus,
        loading,
        messageApi,
    }: {
        supplierList: SupplierList,
        dataSource: readonly ListItem[] | undefined,
        setDataSource: any,
        fetchFunction: (params: any) => Promise<any>,
        editableKeys: React.Key[],
        setEditableRowKeys: (keys: React.Key[]) => void,
        actionRef: any,
        setPreventFocus: (value: boolean) => void,
        loading: boolean,
        messageApi: MessageInstance,
    }
) {

    const columns: ProColumns<ListItem>[] = [
        {
            title: 'Código',
            dataIndex: 'sku',
            width: window.innerWidth < 1024 ? '3%' : '6%',
            valueType: 'digit',
            search: false,
            editable: false,
            sorter: (a, b) => {
                setPreventFocus(true);
                return a.product.sku - b.product.sku
            },
            render: (text, record, index, action) => {
                return <span className='font-bold'>{record.product.sku}</span>
            }
        },
        {
            title: 'Cantidad',
            dataIndex: 'quantity',
            valueType: 'digit',
            search: false,
            width: window.innerWidth < 1024 ? '4%' : '7%',
            align: 'right',
            sorter: (a, b) => {
                setPreventFocus(true);
                return a.quantity - b.quantity
            },
            render: (text, record, index, action) => {
                return <span className='font-bold text-end'>{record.quantity}</span>
            }
        },
        {
            title: 'Producto',
            dataIndex: 'name',
            width: window.innerWidth < 1024 ? '8%' : '25%',
            editable: false,
            search: {
                transform: (value: string) => ({ product: { name: value } })
            },
            sorter: (a, b) => {
                setPreventFocus(true);
                return a.product.name.localeCompare(b.product.name)
            },
            render: (text, record, index, action) => {
                return <span>{record.product.name}</span>
            }
        },
        {
            title: 'Proveedor',
            dataIndex: 'provider.name',
            width: window.innerWidth < 1024 ? '6%' : '8%',
            editable: false,
            search: false,
            sorter: (a, b) => {
                setPreventFocus(true);
                return a.product.supplier?.name.localeCompare(b.product.supplier?.name!)!
            },
            render: (text, record, index, action) => {
                return <span>{record.product.supplier?.name}</span>
            }
        },
        {
            title: 'Novedad',
            dataIndex: 'comment',
            valueType: 'textarea',
            width: window.innerWidth < 1024 ? '8%' : '20%',
            search: false,
        },
        {
            title: '',
            valueType: 'option',
            width: window.innerWidth < 1024 ? '5%' : '7%',
            fixed: 'right',
            render: (text, record, _, action) => [
                <Button
                    key={record.id + 'edit'}
                    type="text"
                    size='large'
                    icon={<EditOutlined style={{ fontSize: '1.1rem' }} />}
                    onClick={() => action?.startEditable?.(record.id!)}
                />,
                <Popconfirm
                    key={record.id + 'delete'}
                    title="Se eliminará el producto de la lista"
                    onConfirm={() => deleteListItem(record.id!)}
                    okText="Eliminar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                >
                    <Button
                        type="text"
                        size='large'
                        style={{ marginLeft: '-12px' }}
                        icon={<DeleteOutlined style={{ fontSize: '1.1rem' }} />}
                        danger
                    />
                </Popconfirm>,
            ],
        },
    ];

    async function updateListItem(key: any, listItem: ListItem) {
        console.log(key, listItem);
        listItem.updatedAt = undefined;
        try {
            await axios.put('/api/lists/' + supplierList.id + '/items/', listItem);
            messageApi.success('Producto actualizado correctamente');
            actionRef.current?.reload();
            setPreventFocus(true);
        } catch (error) {
            console.error(error);
            messageApi.error('Error al actualizar el producto');
        }
    }


    async function deleteListItem(id: string) {
        try {
            await axios.delete('/api/lists/' + supplierList.id + '/items/' + id);
            setPreventFocus(true);
            messageApi.success('Producto eliminado correctamente');
            actionRef.current?.reload();
        } catch (error) {
            console.error(error);
            messageApi.error('Error al eliminar el producto');
        }
    }


    return <EditableProTable<ListItem>
        rowKey="id"
        scroll={{
            x: 960,
            y: 600
        }}
        size={window.innerWidth < 1024 ? 'small' : 'middle'}
        className="mx-2.5 lg:mx-0"
        recordCreatorProps={false}
        loading={loading}
        columns={columns}
        actionRef={actionRef}
        request={fetchFunction}
        value={dataSource}
        onChange={setDataSource}
        editable={{
            type: 'single',
            editableKeys,
            onSave: updateListItem,
            onlyOneLineEditorAlertMessage: 'Solo se puede editar una fila a la vez',
            onChange: setEditableRowKeys,
            saveText: (
                <Button
                    type="text"
                    size='large'
                    icon={<CheckOutlined style={{ fontSize: '1.1rem' }} />}
                    color='default'
                />
            ),
            cancelText: (
                <Button
                    type="text"
                    size='large'
                    style={{ marginLeft: '-12px' }}
                    icon={<CloseOutlined style={{ fontSize: '1.1rem' }} />}
                    danger
                />
            ),
            actionRender: (row, config, dom) => {
                return [dom.save, dom.cancel];
            }
        }}
    />
}