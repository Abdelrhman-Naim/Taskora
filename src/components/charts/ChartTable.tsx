import React from 'react';
import styles from './ChartTable.module.css';

export interface ChartTableData {
  headers: string[];
  rows: (string | number)[][] ;
}

export interface ChartTableProps {
  data: ChartTableData;
  caption?: string;
}

export function ChartTable({ data, caption }: ChartTableProps): React.ReactElement {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        {caption && <caption className="visually-hidden">{caption}</caption>}
        <thead>
          <tr>
            {data.headers.map((h, i) => (
              <th key={i} scope="col" className={styles.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rIdx) => (
            <tr key={rIdx} className={styles.tr}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className={styles.td}>
                  {typeof cell === 'string' ? <bdi>{cell}</bdi> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
