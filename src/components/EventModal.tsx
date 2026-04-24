import type {
  CharacterDecision,
  EventResolution,
  GameEvent,
  RunState,
} from '../types';
import { riskColor, traitDisplayName } from '../utils/helpers';

interface Props {
  event: GameEvent;
  state: RunState;
  resolution: EventResolution | null;
  onResolve: () => void;
  onOmenSelect: (optionId: string) => void;
  selectingOmen: boolean;
}

function PreResolutionView({
  event,
  state,
  previewDecisions,
  onResolve,
  onOmenSelect,
  selectingOmen,
}: {
  event: GameEvent;
  state: RunState;
  previewDecisions: CharacterDecision[];
  onResolve: () => void;
  onOmenSelect: (optionId: string) => void;
  selectingOmen: boolean;
}) {
  const aggregateLean: Record<string, number> = {};
  for (const option of event.options) {
    aggregateLean[option.id] = 0;
  }
  for (const dec of previewDecisions) {
    for (const option of event.options) {
      aggregateLean[option.id] += (dec.scores[option.id] ?? 0);
    }
  }

  const leaningOptionId = Object.entries(aggregateLean).reduce(
    (best, [id, score]) => (score > aggregateLean[best] ? id : best),
    event.options[0].id
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-4 text-sm text-gray-300 leading-relaxed">{event.description}</div>

      {selectingOmen && (
        <div className="mb-3 p-2 rounded bg-violet-900 border border-violet-600 text-xs text-violet-300">
          請選擇下方一個選項，將你的神聖神諭引導向該選項。
        </div>
      )}

      <div className="space-y-3 mb-5">
        {event.options.map((option) => {
          const isLeaning = option.id === leaningOptionId;
          const isOmenTarget = state.activeOmenOptionId === option.id;

          return (
            <div
              key={option.id}
              onClick={() => selectingOmen && onOmenSelect(option.id)}
              className={[
                'rounded-lg border p-3 transition-all',
                selectingOmen && 'cursor-pointer hover:border-violet-500',
                isOmenTarget && 'border-violet-500 bg-violet-950',
                isLeaning && !isOmenTarget && 'border-amber-700 bg-amber-950/30',
                !isLeaning && !isOmenTarget && !selectingOmen && 'border-gray-700 bg-gray-800/50',
                !isLeaning && !isOmenTarget && selectingOmen && 'border-gray-700 bg-gray-800/50',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  {isLeaning && (
                    <span className="text-amber-400 text-xs font-bold shrink-0">
                      ▶ 傾向
                    </span>
                  )}
                  {isOmenTarget && (
                    <span className="text-violet-400 text-xs font-bold shrink-0">
                      👁 神諭
                    </span>
                  )}
                  <span className="text-sm font-semibold text-gray-200">{option.label}</span>
                </div>
                <span className={`text-xs shrink-0 ${riskColor(option.riskLevel)}`}>
                  {option.riskLevel === 'high' ? '高' : option.riskLevel === 'medium' ? '中' : '低'}風險
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{option.description}</p>

              <div className="flex flex-wrap gap-2">
                {previewDecisions.map((dec) => {
                  const prefers = dec.preferredOptionId === option.id;
                  const topTag = dec.tags[option.id]?.[0];
                  return (
                    <div
                      key={dec.characterId}
                      className={`text-xs flex items-center gap-1 ${
                        prefers ? 'text-amber-300' : 'text-gray-600'
                      }`}
                      title={topTag ?? ''}
                    >
                      <span>{prefers ? '★' : '·'}</span>
                      <span>{dec.characterName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onResolve}
        disabled={selectingOmen}
        className="btn-primary w-full"
      >
        交由隊伍決定
      </button>
    </div>
  );
}

function PostResolutionView({
  event,
  resolution,
}: {
  event: GameEvent;
  resolution: EventResolution;
}) {
  const chosen = event.options.find((o) => o.id === resolution.chosenOptionId)!;
  const divinePreferred = event.options.find((o) => o.id === resolution.divinePreferredOptionId)!;

  return (
    <div className="animate-fade-in space-y-4">
      <div
        className={`rounded-lg border p-3 ${
          resolution.followedDivineIntent
            ? 'border-green-700 bg-green-950/30'
            : 'border-amber-700 bg-amber-950/30'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-gray-100">
            隊伍選擇了：{chosen.label}
          </span>
          {resolution.followedDivineIntent ? (
            <span className="text-xs text-green-400">✓ 遵循神意</span>
          ) : (
            <span className="text-xs text-amber-400">⚠ 偏離意圖</span>
          )}
        </div>
        {resolution.divergenceNote && (
          <p className="text-xs text-amber-500">{resolution.divergenceNote}</p>
        )}
        {resolution.followedDivineIntent && (
          <p className="text-xs text-green-600">
            你的意志得以實現。（你的神意偏好：{divinePreferred.label}）
          </p>
        )}
      </div>

      <div className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-gray-700 pl-3">
        {resolution.outcomeText}
      </div>

      {(resolution.hpChangePerMember !== 0 || resolution.stressChangePerMember !== 0) && (
        <div className="flex gap-4 text-xs">
          {resolution.hpChangePerMember !== 0 && (
            <span
              className={resolution.hpChangePerMember > 0 ? 'text-green-400' : 'text-red-400'}
            >
              體力 {resolution.hpChangePerMember > 0 ? '+' : ''}
              {resolution.hpChangePerMember}（每人）
            </span>
          )}
          {resolution.stressChangePerMember !== 0 && (
            <span
              className={
                resolution.stressChangePerMember < 0 ? 'text-green-400' : 'text-amber-400'
              }
            >
              壓力 {resolution.stressChangePerMember > 0 ? '+' : ''}
              {resolution.stressChangePerMember}（每人）
            </span>
          )}
        </div>
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          他們為何如此選擇
        </div>
        <div className="space-y-2">
          {resolution.characterDecisions.map((dec) => {
            const tags = dec.tags[resolution.chosenOptionId] ?? [];
            const preferred = dec.preferredOptionId === resolution.chosenOptionId;
            return (
              <div key={dec.characterId} className="text-xs">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="font-medium text-gray-300">{dec.characterName}</span>
                  {preferred ? (
                    <span className="text-amber-400 text-xs">★ 偏好此選項</span>
                  ) : (
                    <span className="text-gray-600 text-xs">
                      · 偏好 {event.options.find((o) => o.id === dec.preferredOptionId)?.label}
                    </span>
                  )}
                </div>
                {tags.length > 0 ? (
                  <ul className="space-y-0.5 pl-3">
                    {tags.slice(0, 3).map((tag, i) => (
                      <li key={i} className="text-gray-500 leading-relaxed">
                        – {tag}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 pl-3">– 無明顯影響因素。</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function EventModal({
  event,
  state,
  resolution,
  onResolve,
  onOmenSelect,
  selectingOmen,
}: Props) {
  const previewDecisions = state.party
    .filter((a) => a.alive)
    .map((char) => {
      const scores: Record<string, number> = {};
      const tags: Record<string, string[]> = {};
      for (const option of event.options) {
        let s = option.baseWeight;
        for (const trait of char.traits) {
          s += option.traitBonuses[trait] ?? 0;
        }
        scores[option.id] = s;
        const optTags: string[] = [];
        for (const trait of char.traits) {
          const b = option.traitBonuses[trait] ?? 0;
          const name = traitDisplayName(trait);
          if (b >= 0.3) optTags.push(`${name}強烈傾向此選擇。`);
          else if (b >= 0.15) optTags.push(`${name}傾向此選擇。`);
          else if (b <= -0.3) optTags.push(`${name}強烈抗拒此選擇。`);
        }
        tags[option.id] = optTags;
      }
      const preferredOptionId = Object.entries(scores).reduce(
        (best, [id, sc]) => (sc > scores[best] ? id : best),
        event.options[0].id
      );
      return {
        characterId: char.id,
        characterName: char.name,
        preferredOptionId,
        scores,
        tags,
        breakdown: {} as any,
      };
    });

  const eventTypeLabel: Record<string, string> = {
    route_choice: '路線選擇',
    moral_dilemma: '道德兩難',
    temptation: '誘惑',
    combat: '戰鬥',
    boss: '首領遭遇',
    extraction: '撤離',
  };

  return (
    <div className="panel p-5 flex flex-col gap-4 h-full overflow-y-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600 uppercase tracking-wide">
            {eventTypeLabel[event.type] ?? event.type}
          </span>
          {resolution?.interventionUsed && (
            <span className="text-xs text-violet-400">
              {resolution.interventionUsed === 'omen' ? '👁 神諭已使用' : '✦ 祝福已使用'}
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold text-gray-100">{event.title}</h2>
      </div>

      {resolution ? (
        <PostResolutionView event={event} resolution={resolution} />
      ) : (
        <PreResolutionView
          event={event}
          state={state}
          previewDecisions={previewDecisions}
          onResolve={onResolve}
          onOmenSelect={onOmenSelect}
          selectingOmen={selectingOmen}
        />
      )}
    </div>
  );
}
