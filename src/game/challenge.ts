import type { ChallengeProgress, DailyChallenge, DayTheme, PlayerState } from './types';

/** Minimum cups for the 薄荷清晨 「无人久等」 day so an empty shift can't win it. */
const NO_WALKOUT_MIN_SERVED = 4;

export function challengeFor(day: number, theme: DayTheme): DailyChallenge {
  const reward = 25 + 5 * Math.min(day, 12);
  const step = Math.min(8, 3 + Math.floor((day - 1) / 4));
  switch (theme.id) {
    case 'noon':
      return { kind: 'perfect', target: step, label: `完美出杯 ${step} 杯`, short: '完美出杯', reward };
    case 'dusk':
      return { kind: 'combo', target: step, label: `连击达到 ×${step}`, short: '最高连击', reward };
    case 'night': {
      const target = Math.min(4, 1 + Math.floor((day - 1) / 5));
      return { kind: 'delivery3', target, label: `外卖拿到三星 ${target} 单`, short: '外卖三星', reward };
    }
    case 'morning':
      return {
        kind: 'noWalkout',
        target: NO_WALKOUT_MIN_SERVED,
        label: `出杯 ${NO_WALKOUT_MIN_SERVED} 杯以上，且没有人等太久离开`,
        short: '无人久等',
        reward,
      };
    case 'candy':
      return { kind: 'categories', target: 3, label: '茶饮、奶昔、冰淇淋各出一杯', short: '三个品类', reward };
  }
}

/**
 * Live progress. `final` settles 「无人久等」, which can only be judged once
 * the shift is over; every other kind is done the moment it is reached.
 */
export function challengeProgress(challenge: DailyChallenge, player: PlayerState, final = false): ChallengeProgress {
  switch (challenge.kind) {
    case 'perfect':
      return reached(challenge, player.perfectToday);
    case 'combo':
      return reached(challenge, player.maxComboToday);
    case 'delivery3':
      return reached(challenge, player.delivery3Today);
    case 'categories':
      return reached(challenge, player.categoriesServed.length);
    case 'noWalkout': {
      const failed = player.walkouts > 0;
      const value = Math.min(challenge.target, player.servedToday);
      return { challenge, value, failed, done: final && !failed && player.servedToday >= challenge.target };
    }
  }
}

function reached(challenge: DailyChallenge, raw: number): ChallengeProgress {
  const value = Math.min(challenge.target, raw);
  return { challenge, value, failed: false, done: value >= challenge.target };
}
