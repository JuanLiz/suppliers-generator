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
        setPreventFocus
    }: {
        dataSource: readonly ListItem[] | undefined,
        setDataSource: any,
        fetchFunction: (params: any) => Promise<any>,
        updateFunction: (key: any, listItem: ListItem) => Promise<void>,
        deleteFunction: (id: string) => void,
        editableKeys: React.Key[],
        setEditableRowKeys: (keys: React.Key[]) => void,
        actionRef: any,
        setPreventFocus: (value: boolean) => void
    }
) {

    const columns: ProColumns<ListItem>[] = [
        {
            title: 'Código',
            dataIndex: 'sku',
            width: '6%',
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
            width: '7%',
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
            width: '25%',
            editable: false,
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
            width: '8%',
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
            width: '20%',
            search: false,
        },
        {
            title: '',
            valueType: 'option',
            width: '7%',
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
        }}
        className="-mt-4"
        recordCreatorProps={false}
        loading={dataSource == undefined}
        columns={columns}
        actionRef={actionRef}
        request={fetchFunction}
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