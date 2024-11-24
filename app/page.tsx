'use client'

import { SupplierList } from "@/interfaces/SupplierList";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, List, Popconfirm, Popover } from "antd";
import { useForm } from "antd/es/form/Form";
import Paragraph from "antd/es/typography/Paragraph";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {

  const [supplierLists, setSupplierLists] = useState<SupplierList[]>();
  const [createOpen, setCreateOpen] = useState(false);
  const [creatingList, setCreatingList] = useState(false);
  const [newListForm] = useForm();


  async function getSupplierLists() {
    try {
      const response = await axios.get<SupplierList[]>('/api/lists');
      setSupplierLists(response.data.reverse());
    } catch (error) {
      console.error(error);
    }

  }

  async function createSupplierList(values: any) {
    setCreatingList(true);
    try {
      await axios.post('/api/lists', values);
      getSupplierLists();
    } catch (error) {
      console.error(error);
    } finally {
      newListForm.resetFields();
      setCreateOpen(false);
      setCreatingList(false);
    }
  }

  async function updateSupplierListName(id: string, name: string) {
    try {
      await axios.put(`/api/lists`, { id, name });
      getSupplierLists();
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteSupplierList(id: string) {
    try {
      await axios.delete(`/api/lists/${id}`);
      getSupplierLists();
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    getSupplierLists();
  }, []);


  return (
    <div className="bg-gray-200/70 min-h-screen">
      {/* {contextHolder} */}
      <main className="flex flex-col max-w-screen-lg mx-auto p-4 lg:p-12 gap-6">
        <div className="p-12 rounded-xl bg-white flex flex-col gap-8 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center w-full justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold">Mis listas</h1>
            <Popover
              title="Crear nueva lista"
              open={createOpen}
              onOpenChange={setCreateOpen}
              content={
                <Form
                  layout="vertical"
                  form={newListForm}
                  onFinish={createSupplierList}
                >
                  <Form.Item
                    label="Nombre de la lista"
                    name="name"
                    rules={[{ required: true, message: 'Ingresa un nombre' }]}
                  >
                    <Input type="text" />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="w-full"
                      loading={creatingList}
                    >
                      Crear
                    </Button>
                  </Form.Item>
                </Form>
              }
              trigger="click"
            >
              <Button
                type="primary"
                size="large"
                style={{
                  height: '3rem',
                  borderRadius: '1rem',
                }}
                icon={<PlusOutlined />}
              >
                Nueva lista
              </Button>
            </Popover>
          </div>
          <List
            loading={!supplierLists}
            itemLayout="horizontal"
            className="border-y border-gray-200"
            dataSource={supplierLists}
            renderItem={item => (
              <List.Item
                key={item.id}
                className="hover:bg-gray-100 border-s-4 border-s-white hover:border-s-orange-500 transition-all duration-300 ease-in-out w-full flex group">
                <Link
                  href={`/lists/${item.id}`}
                  className="flex items-center justify-between w-full ps-4"
                >
                  <List.Item.Meta
                    title={
                      <Paragraph
                        className="text-base font-semibold"
                        style={{
                          marginBottom: 0,
                          lineHeight: '1.75rem',
                          fontSize: '1.125rem'
                        }}
                        editable={{
                          onChange: (name) => {
                            updateSupplierListName(item.id!, name);
                          },
                          icon: (
                            <div className="lg:hidden lg:group-hover:block ms-1">
                              <EditOutlined style={{ color: '#7b7e83' }} />
                            </div>
                          )
                        }}
                      >
                        {item.name}
                      </Paragraph>

                    }
                    description={`Creada el ${new Date(item.creationDate!).toLocaleString()}`}
                  />
                </Link>

                <Popconfirm
                  title="Se eliminará esta lista junto con todos sus productos"
                  onConfirm={() => deleteSupplierList(item.id!)}
                  okText="Eliminar"
                  cancelText="Cancelar"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    size="large"
                    danger
                    className="text-red-500"
                  />
                </Popconfirm>
              </List.Item>
            )}
          />
        </div>
      </main>
    </div>
  );
}
