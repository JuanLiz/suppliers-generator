
import { ListItem } from "@/interfaces/ListItem";
import { Supplier } from "@/interfaces/Supplier";
import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

export interface exportPdfOptions {
    mode: 'all' | 'suppliers';
    dataSource: readonly ListItem[];
    // Options. Sorting by name or supplier
    sort?: 'name' | 'suppliers' | 'sku';
    // Show or hide sku
    showSku: boolean;
    suppliers?: Supplier[]; // Only for mode 'suppliers'
}

export default function ProductListDocument({ mode, dataSource, sort, showSku, suppliers }: exportPdfOptions) {

    // Register font
    Font.register({
        family: 'Inter',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf' },
            { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuOKfMZhrib2Bg-4.ttf', fontStyle: 'normal', fontWeight: 'light' },
            { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf", fontStyle: 'normal', fontWeight: 'semibold' },
            { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf", fontStyle: 'normal', fontWeight: 'bold' },
        ],
    })
    // Define styles for PDF
    var cellLgWidth = mode === 'all'
        ? showSku ? '30%' : '35%'
        : showSku ? '40%' : '45%';

    const styles = StyleSheet.create({
        page: {
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            padding: 30,
        },
        title: {
            fontFamily: 'Inter',
            fontSize: 18,
            fontWeight: 'bold'
        },
        supplierTitle: {
            fontFamily: 'Inter',
            fontSize: 13,
            fontWeight: 'bold',
            marginBottom: 10
        },
        sectionSeparator: {
            marginBottom: 20
        },
        timeStamp: {
            fontFamily: 'Inter',
            fontSize: 9,
            fontWeight: 'light',
            paddingBottom: 20
        },
        table: {
            display: 'flex',
            width: 'auto',
            borderStyle: 'solid',
            borderWidth: 1,
            borderRightWidth: 0,
            borderBottomWidth: 0,
        },
        tableRow: {
            margin: 'auto',
            flexDirection: 'row',
        },
        headerSm: {
            width: '10%',
            borderStyle: 'solid',
            borderWidth: 1,
            borderLeftWidth: 0,
            borderTopWidth: 0,
            backgroundColor: '#f0f0f0',
            padding: 3,
        },
        headerMd: {
            width: '20%',
            borderStyle: 'solid',
            borderWidth: 1,
            borderLeftWidth: 0,
            borderTopWidth: 0,
            backgroundColor: '#f0f0f0',
            padding: 3,
        },
        headerLg: {
            width: cellLgWidth,
            borderStyle: 'solid',
            borderWidth: 1,
            borderLeftWidth: 0,
            borderTopWidth: 0,
            backgroundColor: '#f0f0f0',
            padding: 3,
        },
        tableColSm: {
            width: '10%',
            borderStyle: 'solid',
            borderWidth: 1,
            borderLeftWidth: 0,
            borderTopWidth: 0,
            padding: 3,
        },
        tableColMd: {
            width: '20%',
            borderStyle: 'solid',
            borderWidth: 1,
            borderLeftWidth: 0,
            borderTopWidth: 0,
            padding: 3,
        },
        tableColLg: {
            width: cellLgWidth,
            borderStyle: 'solid',
            borderWidth: 1,
            borderLeftWidth: 0,
            borderTopWidth: 0,
            padding: 3,
        },
        tableCellHeader: {
            margin: 3,
            fontFamily: 'Inter',
            fontSize: 9,
            fontWeight: 'semibold'
        },
        tableCell: {
            margin: 3,
            fontFamily: 'Inter',
            fontSize: 8,
            fontWeight: 'normal',
        }
    })

    // Sort data

    let sortedDataSource = [...dataSource];
    if (mode === 'all' && sort === 'name') {
        sortedDataSource = sortedDataSource.sort((a, b) => a.product.name.localeCompare(b.product.name))
    }
    if (mode === 'all' && sort === 'sku') {
        sortedDataSource = sortedDataSource.sort((a, b) => a.product.sku - b.product.sku)
    }
    if (mode === 'all' && sort === 'suppliers') {
        sortedDataSource = sortedDataSource.sort((a, b) => {
            return (a.product.supplier?.name!).localeCompare(b.product.supplier?.name!)
        })
    }


    // PDF Document component
    return dataSource && (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* Title */}
                <View>
                    <Text style={styles.title}>
                        {dataSource[0].supplierList.name}
                    </Text>
                    {/* Generated Date */}
                    <Text style={styles.timeStamp}>
                        Generada el {new Date().toLocaleString()}
                    </Text>
                </View>
                {mode === 'all' ? (
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={styles.tableRow}>
                            {showSku && <View style={styles.headerSm}>
                                <Text style={styles.tableCellHeader}>Código</Text>
                            </View>}
                            <View style={styles.headerSm}>
                                <Text style={styles.tableCellHeader}>Cant.</Text>
                            </View>
                            <View style={styles.headerLg}>
                                <Text style={styles.tableCellHeader}>Producto</Text>
                            </View>
                            <View style={styles.headerMd}>
                                <Text style={styles.tableCellHeader}>Proveedor</Text>
                            </View>
                            <View style={styles.headerLg}>
                                <Text style={styles.tableCellHeader}>Novedad</Text>
                            </View>
                        </View>

                        {/* Table Rows */}
                        {sortedDataSource?.map((item, index) => (
                            <View key={index} style={styles.tableRow} wrap={false}>
                                {showSku && <View style={styles.tableColSm}>
                                    <Text style={styles.tableCell}>{item.product.sku}</Text>
                                </View>}
                                <View style={styles.tableColSm}>
                                    <Text style={styles.tableCell}>{item.quantity}</Text>
                                </View>
                                <View style={styles.tableColLg}>
                                    <Text style={styles.tableCell}>{item.product.name}</Text>
                                </View>
                                <View style={styles.tableColMd}>
                                    <Text style={styles.tableCell}>{item.product.supplier?.name}</Text>
                                </View>
                                <View style={styles.tableColLg}>
                                    <Text style={styles.tableCell}>{item.comment}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : mode === 'suppliers' && suppliers && suppliers.map((supplier, supplierIndex) => (
                    <View key={supplierIndex} style={styles.sectionSeparator}>
                        <View>
                            <Text style={styles.supplierTitle}>
                                {supplier.name}
                            </Text>
                        </View>

                        <View style={styles.table}>
                            <View style={styles.tableRow} wrap={false}>
                                {showSku && (
                                    <View style={styles.headerSm}>
                                        <Text style={styles.tableCellHeader}>Código</Text>
                                    </View>
                                )}
                                <View style={styles.headerSm}>
                                    <Text style={styles.tableCellHeader}>Cant.</Text>
                                </View>
                                <View style={styles.headerLg}>
                                    <Text style={styles.tableCellHeader}>Producto</Text>
                                </View>
                                <View style={styles.headerLg}>
                                    <Text style={styles.tableCellHeader}>Novedad</Text>
                                </View>
                            </View>

                            {dataSource
                                .filter(item => item.product.supplier?.name === supplier.name)
                                .map((item, index) => (
                                    <View key={index} style={styles.tableRow} wrap={false}>
                                        {showSku && (
                                            <View style={styles.tableColSm}>
                                                <Text style={styles.tableCell}>{item.product.sku}</Text>
                                            </View>
                                        )}
                                        <View style={styles.tableColSm}>
                                            <Text style={styles.tableCell}>{item.quantity}</Text>
                                        </View>
                                        <View style={styles.tableColLg}>
                                            <Text style={styles.tableCell}>{item.product.name}</Text>
                                        </View>
                                        <View style={styles.tableColLg}>
                                            <Text style={styles.tableCell}>{item.comment}</Text>
                                        </View>
                                    </View>
                                ))}
                        </View>
                    </View>
                ))}
            </Page>
        </Document>
    )
}