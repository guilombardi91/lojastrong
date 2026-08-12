import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { formatDateTime } from '../utils'
import type { ReportExport } from './types'

// Fonte padrão (Helvetica) usa WinAnsiEncoding, que já cobre os acentos do
// português — não precisa embutir uma fonte só para isso.

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a2e' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 9, color: '#666', marginBottom: 18 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statBox: {
    borderWidth: 1,
    borderColor: '#e3e3ea',
    borderRadius: 4,
    padding: 8,
    minWidth: 130,
  },
  statLabel: { fontSize: 7.5, color: '#888', textTransform: 'uppercase', marginBottom: 3 },
  statValue: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  statHint: { fontSize: 7.5, color: '#888', marginTop: 2 },
  tableTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 6, marginTop: 14 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerRow: { flexDirection: 'row', backgroundColor: '#0b2e52', paddingVertical: 4 },
  cell: { flex: 1, padding: 4 },
  headerCell: { flex: 1, padding: 4, color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  empty: { padding: 8, color: '#888', fontStyle: 'italic' },
})

function ReportDocument({ data }: { data: ReportExport }) {
  return (
    <Document title={data.title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.subtitle}>
          Período: {data.periodLabel} · Gerado em {formatDateTime(data.generatedAt)}
        </Text>

        {data.stats.length > 0 && (
          <View style={styles.statsRow}>
            {data.stats.map((stat) => (
              <View key={stat.label} style={styles.statBox}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                {stat.hint && <Text style={styles.statHint}>{stat.hint}</Text>}
              </View>
            ))}
          </View>
        )}

        {data.tables.map((table) => (
          <View key={table.title} wrap={false}>
            <Text style={styles.tableTitle}>{table.title}</Text>
            {table.rows.length === 0 ? (
              <Text style={styles.empty}>Sem dados no período.</Text>
            ) : (
              <>
                <View style={styles.headerRow}>
                  {table.headers.map((header, index) => (
                    <Text key={index} style={styles.headerCell}>
                      {header}
                    </Text>
                  ))}
                </View>
                {table.rows.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.row}>
                    {row.map((cell, cellIndex) => (
                      <Text key={cellIndex} style={styles.cell}>
                        {String(cell)}
                      </Text>
                    ))}
                  </View>
                ))}
              </>
            )}
          </View>
        ))}
      </Page>
    </Document>
  )
}

export async function buildReportPdf(data: ReportExport): Promise<Buffer> {
  return renderToBuffer(<ReportDocument data={data} />)
}
