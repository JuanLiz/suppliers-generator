'use client'
import ProductListDocument from '@/components/ProductListDocument';
import { ListItem } from '@/interfaces/ListItem';
import { Supplier } from '@/interfaces/Supplier';
import { SupplierList } from '@/interfaces/SupplierList';
import { Download, FileSuccessOne } from '@icon-park/react';
import { pdf } from '@react-pdf/renderer';
import { Button, Checkbox, Popover, Segmented } from 'antd';
import { useEffect, useState } from "react";

export default function ExportDocumentButton({
    viewMode,
    dataSource,
    allSuppliers,
    supplierList,
    messageApi
}: {
    viewMode: 'all' | 'suppliers',
    dataSource: readonly ListItem[] | undefined,
    allSuppliers: Supplier[] | undefined,
    supplierList: SupplierList | undefined,
    messageApi: any
}) {

    // Generate PDF loading state
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfSaveMode, setPdfSaveMode] = useState<'all' | 'suppliers'>('all');
    const [pdfShowSku, setPdfShowSku] = useState<boolean>(true);
    const [pdfSort, setPdfSort] = useState<'name' | 'suppliers' | 'sku'>('suppliers');
    const [exportPdfVisible, setExportPdfVisible] = useState(false);

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

    // Change pdf options on mode change
    useEffect(() => {
        setPdfSaveMode(viewMode);
    }, [viewMode]);


    return (
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
                                    label: 'Proveedor',
                                    value: 'suppliers'
                                },
                                {
                                    label: 'Producto',
                                    value: 'name'
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
            placement={window.innerWidth < 640 ? 'bottom' : 'bottomRight'}
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
    )

}