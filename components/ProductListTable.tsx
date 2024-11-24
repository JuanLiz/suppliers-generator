import { ListItem } from "@/interfaces/ListItem";
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { EditableProTable, ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm } from "antd";

export default function ProductListTable(
    {
        actionRef,
        dataSource,
        setDataSource,
        fetchFunction,
        updateFunction,
        deleteFunction,
        editableKeys,
        setEditableRowKeys,
        setPreventFocus,
        loading
    }: {
        dataSource: readonly ListItem[] | undefined,
        setDataSource: any,
        fetchFunction: (params: any) => Promise<any>,
        updateFunction: (key: any, listItem: ListItem) => Promise<void>,
        deleteFunction: (id: string) => void,
        editableKeys: React.Key[],
        setEditableRowKeys: (keys: React.Key[]) => void,
        actionRef: any,
        setPreventFocus: (value: boolean) => void,
        loading: boolean
    }
) {

    const columns: ProColumns<ListItem>[] = [
        {
            title: 'Código',
            dataIndex: 'sku',
            width: screen.width < 1024 ? '3%' : '6%',
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
            width: screen.width < 1024 ? '4%' : '7%',
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
            width: screen.width < 1024 ? '8%' : '25%',
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
            width: screen.width < 1024 ? '6%' : '8%',
            editable: false,
            search: false,
            render: (text, record, index, action) => {
                return <span>{record.product.supplier?.name}</span>
            }
        },
        {
            title: 'Novedad',
            dataIndex: 'comment',
            valueType: 'textarea',
            width: screen.width < 1024 ? '8%' : '20%',
            search: false,
        },
        {
            title: '',
            valueType: 'option',
            width: screen.width < 1024 ? '5%' : '7%',
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
                    onConfirm={() => deleteFunction(record.id!)}
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


    return <EditableProTable<ListItem>
        rowKey="id"
        scroll={{
            x: 960,
            y: 600
        }}
        size={screen.width < 1024 ? 'small' : 'middle'}
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
            onSave: updateFunction,
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