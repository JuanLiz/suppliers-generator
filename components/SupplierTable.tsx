// Recieve data from the parent component and display it in a table format

import { ListItem } from "@/interfaces/ListItem";
import { Table, TableColumnsType } from "antd";

// Params: supplier name and dataset
export default function SupplierTable(
    {
        supplier,
        data
    }: {
        supplier: string,
        data: ListItem[]
    }
) {

    const columns: TableColumnsType<ListItem> = [
        {
            title: 'Código',
            dataIndex: 'sku',
            width: '5%',
            render: (value, record, index) => {
                return <span className='font-bold text-end'>{record.product.sku}</span>
            }
        },
        {
            title: 'Cantidad',
            dataIndex: 'quantity',
            width: '5%',
            align: 'right',
            render: (value, record, index) => {
                return <span className='font-bold text-end'>{record.quantity}</span>
            }
        },
        {
            title: 'Producto',
            dataIndex: 'name',
            width: '50%',
            render: (value, record, index) => {
                return record.product.name
            }
        },
        {
            title: 'Novedad',
            dataIndex: 'comment',
            width: '50%',
            render: (value, record, index) => {
                return <span>{record.comment}</span>
            }
        },
    ];

    return (
        <div className="flex flex-col gap-3 rounded-xl w-full shadow-sm p-4 md:p-6 border border-gray-300">
            <h2 className="font-bold text-lg">{supplier}</h2>
            <Table<ListItem>
                rowKey="id"
                columns={columns}
                dataSource={data}
                size="middle"
                pagination={false}
            />
        </div>
    )
}