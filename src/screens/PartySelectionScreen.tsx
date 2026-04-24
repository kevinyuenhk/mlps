import { useState } from 'react';
import type { Adventurer } from '../types';
import { ADVENTURER_POOL } from '../data/adventurers';
import AdventurerCard from '../components/AdventurerCard';

interface Props {
  onConfirm: (selectedIds: string[]) => void;
}

const MAX_PARTY = 3;

export default function PartySelectionScreen({ onConfirm }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggleSelect(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else if (selected.length < MAX_PARTY) {
      setSelected([...selected, id]);
    }
  }

  const canContinue = selected.length === MAX_PARTY;

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">覺醒神殿</div>
          <h1 className="text-2xl font-bold text-gray-100">召集你的隊伍</h1>
          <p className="text-sm text-gray-500 mt-1">
            選擇 3 名冒險者，派往荒廢墓地。
          </p>
        </div>

        {/* Mission summary */}
        <div className="panel p-4 text-sm w-full sm:w-64 sm:shrink-0">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">任務</div>
          <div className="font-semibold text-amber-300 mb-1">取回神聖神器</div>
          <div className="text-gray-500 text-xs leading-relaxed">
            區域：荒廢墓地<br/>
            危險度：高<br/>
            預估時間：未知
          </div>
        </div>
      </div>

      {/* Party slot indicators */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <span className="text-sm text-gray-500">隊伍位置：</span>
        {Array.from({ length: MAX_PARTY }, (_, i) => {
          const member = selected[i]
            ? ADVENTURER_POOL.find((a) => a.id === selected[i])
            : null;
          return (
            <div
              key={i}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                member
                  ? 'border-amber-600 bg-amber-950/30 text-amber-300'
                  : 'border-gray-700 bg-gray-900 text-gray-700'
              }`}
            >
              {member ? member.name : `位置 ${i + 1}`}
            </div>
          );
        })}
        <span className="text-xs text-gray-600 ml-auto">
          已選 {selected.length}/{MAX_PARTY}
        </span>
      </div>

      {/* Adventurer pool */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 flex-1">
        {ADVENTURER_POOL.map((a) => (
          <AdventurerCard
            key={a.id}
            adventurer={a}
            selected={selected.includes(a.id)}
            selectable={true}
            onClick={() => toggleSelect(a.id)}
          />
        ))}
      </div>

      {/* Trait legend */}
      <div className="panel p-3">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">特性指南</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-4 gap-y-1 text-xs text-gray-500">
          {[
            ['勇敢', '衝向危險；抗拒撤退'],
            ['忠誠', '專注任務；投票影響力較大'],
            ['固執', '堅守立場；抗拒撤退'],
            ['慈悲', '優先救助他人；可能拖慢隊伍'],
            ['膽怯', '偏好安全；迴避戰鬥'],
            ['虔誠', '神意影響力放大30%'],
            ['貪婪', '受財寶誘惑；無視警告'],
            ['機智', '偏好戰術/偵察類選項'],
            ['懷疑', '神意影響力降低50%'],
            ['好奇', '被調查/探索所吸引'],
            ['理性', '偏好穩健低風險選項'],
            ['脆弱', '體力低時高風險選項受懲罰'],
            ['冷靜', '穩定；壓力影響較小'],
            ['盡責', '服從命令；任務優先'],
            ['謹慎', '強烈偏好安全路線'],
          ].map(([name, effect]) => (
            <div key={name} className="flex gap-1">
              <span className="font-medium text-gray-400 shrink-0">{name}：</span>
              <span>{effect}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Continue */}
      <div className="flex justify-end">
        <button
          disabled={!canContinue}
          onClick={() => onConfirm(selected)}
          className="btn-primary px-6 sm:px-8 w-full sm:w-auto"
        >
          {canContinue
            ? `以 ${selected.map((id) => ADVENTURER_POOL.find((a) => a.id === id)?.name).join('、')} 出發`
            : `還需選擇 ${MAX_PARTY - selected.length} 名冒險者`}
        </button>
      </div>
    </div>
  );
}
