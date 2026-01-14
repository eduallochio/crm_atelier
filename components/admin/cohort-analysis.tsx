'use client'

import { Card } from '@/components/ui/card'

interface CohortData {
  cohort: string // Mês de aquisição
  month0: number // Retenção no mês 0 (100%)
  month1: number // Retenção no mês 1
  month2: number // Retenção no mês 2
  month3: number // Retenção no mês 3
  month4: number // Retenção no mês 4
  month5: number // Retenção no mês 5
}

interface CohortAnalysisProps {
  data: CohortData[]
}

export function CohortAnalysis({ data }: CohortAnalysisProps) {
  const hasData = data.length > 0

  const getColorIntensity = (value: number) => {
    if (value >= 80) return 'bg-green-500 text-white'
    if (value >= 60) return 'bg-green-400 text-white'
    if (value >= 40) return 'bg-yellow-400 text-black'
    if (value >= 20) return 'bg-orange-400 text-white'
    return 'bg-red-400 text-white'
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Análise de Retenção (Cohorts)</h3>
        <p className="text-sm text-muted-foreground">
          Percentual de usuários retidos por mês de aquisição
        </p>
      </div>

      {hasData ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Cohort</th>
                <th className="text-center p-3 font-medium">Mês 0</th>
                <th className="text-center p-3 font-medium">Mês 1</th>
                <th className="text-center p-3 font-medium">Mês 2</th>
                <th className="text-center p-3 font-medium">Mês 3</th>
                <th className="text-center p-3 font-medium">Mês 4</th>
                <th className="text-center p-3 font-medium">Mês 5</th>
              </tr>
            </thead>
            <tbody>
              {data.map((cohort, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">{cohort.cohort}</td>
                  <td className="p-3">
                    <div className={`text-center rounded py-1 ${getColorIntensity(cohort.month0)}`}>
                      {cohort.month0}%
                    </div>
                  </td>
                  <td className="p-3">
                    <div className={`text-center rounded py-1 ${getColorIntensity(cohort.month1)}`}>
                      {cohort.month1}%
                    </div>
                  </td>
                  <td className="p-3">
                    <div className={`text-center rounded py-1 ${getColorIntensity(cohort.month2)}`}>
                      {cohort.month2}%
                    </div>
                  </td>
                  <td className="p-3">
                    <div className={`text-center rounded py-1 ${getColorIntensity(cohort.month3)}`}>
                      {cohort.month3}%
                    </div>
                  </td>
                  <td className="p-3">
                    <div className={`text-center rounded py-1 ${getColorIntensity(cohort.month4)}`}>
                      {cohort.month4}%
                    </div>
                  </td>
                  <td className="p-3">
                    <div className={`text-center rounded py-1 ${getColorIntensity(cohort.month5)}`}>
                      {cohort.month5}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legenda */}
          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Retenção:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>80%+</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded" />
              <span>60-79%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded" />
              <span>40-59%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-400 rounded" />
              <span>20-39%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-400 rounded" />
              <span>&lt;20%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Nenhum dado de cohort disponível</p>
        </div>
      )}
    </Card>
  )
}
