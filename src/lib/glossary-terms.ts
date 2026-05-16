export type GlossaryTerm = {
  id: string
  name: string
  category: 'Standard — Passing' | 'Standard — Rushing' | 'Standard — Receiving' | 'Standard — Team' | 'Foundational QB' | 'Advanced QB' | 'Team Analytics'
  definition: string
  formula?: string
  source: string
  caveats: string
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [

  // ── Standard — Passing ───────────────────────────────────────────────────

  {
    id: 'comp',
    name: 'Completions',
    category: 'Standard — Passing',
    definition: 'Total pass completions in a season.',
    source: 'Newsday / Section XI official stats',
    caveats: 'Quarterback stats only.',
  },
  {
    id: 'att-pass',
    name: 'Attempts (Passing)',
    category: 'Standard — Passing',
    definition: 'Total pass attempts in a season.',
    source: 'Newsday / Section XI official stats',
    caveats: 'Quarterback stats only.',
  },
  {
    id: 'pass-yds',
    name: 'YDS (Passing)',
    category: 'Standard — Passing',
    definition: 'Total passing yards in a season.',
    source: 'Newsday / Section XI official stats',
    caveats: 'Quarterback stats only.',
  },
  {
    id: 'pass-td',
    name: 'Touchdowns (Passing)',
    category: 'Standard — Passing',
    definition: 'Total touchdown passes thrown in a season.',
    source: 'Newsday / Section XI official stats',
    caveats: 'Quarterback stats only.',
  },
  {
    id: 'int',
    name: 'Interceptions',
    category: 'Standard — Passing',
    definition: 'Total interceptions thrown in a season.',
    source: 'Newsday / Section XI official stats',
    caveats: 'Quarterback stats only.',
  },

  // ── Standard — Rushing ───────────────────────────────────────────────────

  {
    id: 'att-rush',
    name: 'Attempts (Rushing)',
    category: 'Standard — Rushing',
    definition: 'Total rushing attempts in a season.',
    source: 'Newsday / Section XI official stats',
    caveats: 'Top 25 rushers per season only.',
  },
  {
    id: 'rush-yds',
    name: 'YDS (Rushing)',
    category: 'Standard — Rushing',
    definition: 'Total rushing yards in a season.',
    source: 'Newsday / Section XI official stats',
    caveats: 'Top 25 rushers per season only.',
  },
  {
    id: 'rush-td',
    name: 'Touchdowns (Rushing)',
    category: 'Standard — Rushing',
    definition: 'Total rushing touchdowns in a season.',
    source: 'Newsday / Section XI official stats',
    caveats: 'Top 25 rushers per season only.',
  },

  // ── Standard — Receiving ─────────────────────────────────────────────────

  {
    id: 'rec',
    name: 'Receptions',
    category: 'Standard — Receiving',
    definition: 'Total receptions in a season.',
    source: 'Newsday / Section XI official stats',
    caveats: 'Top 25 receivers per season only. 2021–2024; no 2020 data available.',
  },
  {
    id: 'recv-yds',
    name: 'YDS (Receiving)',
    category: 'Standard — Receiving',
    definition: 'Total receiving yards in a season.',
    source: 'Newsday / Section XI official stats',
    caveats: 'Top 25 receivers per season only. 2021–2024; no 2020 data available.',
  },
  {
    id: 'recv-td',
    name: 'Touchdowns (Receiving)',
    category: 'Standard — Receiving',
    definition: 'Total receiving touchdowns in a season.',
    source: 'Newsday / Section XI official stats',
    caveats: 'Top 25 receivers per season only. 2021–2024; no 2020 data available.',
  },

  // ── Standard — Team ──────────────────────────────────────────────────────

  {
    id: 'gp',
    name: 'Games Played',
    category: 'Standard — Team',
    definition: 'Games played in a season. Derived from game logs for 2023 and 2024; not available for earlier seasons.',
    source: 'Derived from games table (2023–2024)',
    caveats: 'Null for 2020–2022 player stat rows — no game log data for those seasons.',
  },
  {
    id: 'w',
    name: 'Wins',
    category: 'Standard — Team',
    definition: 'Total wins in a season, including non-division and playoff games.',
    source: 'Section XI official standings',
    caveats: 'Overall record; see CONF for conference-only record.',
  },
  {
    id: 'l',
    name: 'Losses',
    category: 'Standard — Team',
    definition: 'Total losses in a season.',
    source: 'Section XI official standings',
    caveats: 'Overall record.',
  },
  {
    id: 'pct',
    name: 'Win Percentage',
    category: 'Standard — Team',
    definition: 'Win percentage calculated as wins divided by total games played.',
    formula: 'WIN% = W / (W + L + T)',
    source: 'Derived from standings',
    caveats: 'Ties counted as half a win.',
  },
  {
    id: 'conf',
    name: 'Conference Record',
    category: 'Standard — Team',
    definition: 'Conference record — wins and losses within the team\'s division only.',
    source: 'Section XI official standings',
    caveats: 'Conference schedule varies by division. Non-conference games are excluded.',
  },
  {
    id: 'pf',
    name: 'Points For',
    category: 'Standard — Team',
    definition: 'Points scored across all games in a season.',
    source: 'Derived from game scores (2023–2024)',
    caveats: 'Available for 2023 and 2024 only. Includes playoff games.',
  },
  {
    id: 'pa',
    name: 'Points Against',
    category: 'Standard — Team',
    definition: 'Points allowed across all games in a season.',
    source: 'Derived from game scores (2023–2024)',
    caveats: 'Available for 2023 and 2024 only. Includes playoff games.',
  },
  {
    id: 'avg-pf',
    name: 'Avg PF',
    category: 'Standard — Team',
    definition: 'Average points scored per game during the season.',
    formula: 'Avg PF = PF ÷ Games Played',
    source: 'Derived from game scores',
    caveats: 'Includes playoff games. Higher values indicate greater offensive production.',
  },
  {
    id: 'avg-pa',
    name: 'Avg PA',
    category: 'Standard — Team',
    definition: 'Average points allowed per game during the season.',
    formula: 'Avg PA = PA ÷ Games Played',
    source: 'Derived from game scores',
    caveats: 'Includes playoff games. Lower values indicate stronger defensive performance.',
  },
  {
    id: 'diff',
    name: 'Point Differential',
    category: 'Standard — Team',
    definition: 'Point differential — the margin between points scored and points allowed.',
    formula: 'DIFF = PF − PA',
    source: 'Derived from PF and PA',
    caveats: 'Available for 2023 and 2024 only. Positive values indicate net scoring advantage.',
  },

  // ── Foundational QB ──────────────────────────────────────────────────────

  {
    id: 'comp-pct',
    name: 'COMP%',
    category: 'Foundational QB',
    definition: 'Completion percentage — how often a quarterback completes a pass attempt. A foundational measure of accuracy, consistency, and execution.',
    formula: 'COMP% = (COMP / ATT) × 100',
    source: 'Computed from season passing stats',
    caveats: 'Quarterback stats only. Higher sample sizes (more attempts) produce more reliable values.',
  },
  {
    id: 'ypa',
    name: 'YPA',
    category: 'Foundational QB',
    definition: 'Yards per attempt — average yards gained per pass attempt. Combines accuracy, aggressiveness, and overall passing efficiency.',
    formula: 'YPA = YDS / ATT',
    source: 'Computed from season passing stats',
    caveats: 'Quarterback stats only.',
  },
  {
    id: 'ypc',
    name: 'YPC',
    category: 'Foundational QB',
    definition: 'Yards per completion — average yards gained on completed passes. Captures verticality, downfield aggression, and yards-after-catch impact.',
    formula: 'YPC = YDS / COMP',
    source: 'Computed from season passing stats',
    caveats: 'Quarterback stats only. High YPC with low COMP% may indicate boom-or-bust tendencies.',
  },
  {
    id: 'td-rate',
    name: 'TD Rate',
    category: 'Foundational QB',
    definition: 'Percentage of pass attempts resulting in touchdowns. Reflects scoring efficiency, red-zone execution, and explosive scoring capability.',
    formula: 'TD Rate = (TD / ATT) × 100',
    source: 'Computed from season passing stats',
    caveats: 'Quarterback stats only.',
  },
  {
    id: 'int-rate',
    name: 'INT Rate',
    category: 'Foundational QB',
    definition: 'Percentage of pass attempts resulting in interceptions. Reflects ball security, decision-making, and risk management.',
    formula: 'INT Rate = (INT / ATT) × 100',
    source: 'Computed from season passing stats',
    caveats: 'Quarterback stats only. Lower is better.',
  },
  {
    id: 'td-int',
    name: 'TD:INT',
    category: 'Foundational QB',
    definition: 'Touchdown-to-interception ratio — compares touchdown passes to interceptions. Measures decision-making, scoring vs. turnover balance, and offensive discipline.',
    formula: 'TD:INT = TD / INT',
    source: 'Computed from season passing stats',
    caveats: 'Quarterback stats only. Undefined (∞) when INT = 0; displayed as TD count in those cases.',
  },
  {
    id: 'yva',
    name: 'YVA',
    category: 'Foundational QB',
    definition: 'Yard Value Above Average — how far above or below a quarterback\'s total passing yards are compared to the average of all passers in the dataset. Designed for benchmarking and contextual production analysis.',
    formula: 'YVA = Player Passing Yards − Season Average Passing Yards',
    source: 'Computed from season passing stats',
    caveats: 'Quarterback stats only. Value shifts based on the player pool included in the average.',
  },

  // ── Advanced QB ──────────────────────────────────────────────────────────

  {
    id: 'cmd',
    name: 'CMD — Command Rating',
    category: 'Advanced QB',
    definition: 'Measures how well a quarterback executes the offense with control, accuracy, poise, scoring efficiency, and ball security. CMD rewards quarterbacks who complete passes efficiently, convert drives into points, and avoid costly mistakes.',
    formula: 'CMD = (COMP% × TD Rate) / INT Rate',
    source: 'Football Data Hub — Official Metric Definitions',
    caveats: 'Quarterback stats only. Penalizes heavily for high interception rates. Quarterbacks with 0 interceptions produce an undefined value; INT Rate is floored at a minimum to prevent division by zero.',
  },
  {
    id: 'gbi',
    name: 'GBI — Game Breaker Index',
    category: 'Advanced QB',
    definition: 'Identifies quarterbacks who create explosive plays, scoring swings, and momentum-changing production. GBI emphasizes explosiveness, scoring efficiency, and high-impact decision-making.',
    formula: 'GBI = YPA + (TD:INT × 2) + (TD Rate × 0.5)',
    source: 'Football Data Hub — Official Metric Definitions',
    caveats: 'Quarterback stats only. Quarterbacks with 0 interceptions are handled via TD:INT floor logic.',
  },
  {
    id: 'ies',
    name: 'IES — Intelligent Execution Score',
    category: 'Advanced QB',
    definition: 'Reflects a quarterback\'s ability to make smart, high-value, efficient decisions that maximize scoring while minimizing risk. Multiplies total touchdowns by yards per attempt, then adjusts for turnover impact.',
    formula: 'IES = (TD × YPA) / (INT + 1)',
    source: 'Football Data Hub — Official Metric Definitions',
    caveats: 'Quarterback stats only. The +1 INT adjustment prevents division by zero and moderately penalizes turnover-free seasons less harshly.',
  },
  {
    id: 'hqbr',
    name: 'HQBR — High School Quarterback Rating',
    category: 'Advanced QB',
    definition: 'A custom quarterback rating system designed specifically for high school football. Balances total production, scoring ability, accuracy, decision-making, and workload scaling. Adjusts for volume to reduce inflation from small sample sizes.',
    source: 'Football Data Hub — Official Metric Definitions',
    caveats: 'Quarterback stats only. Formula not yet fully recovered — values displayed are from the original computation and cannot currently be reproduced for new seasons.',
  },
  {
    id: 'powerscore-qb',
    name: 'PowerScore (QB)',
    category: 'Advanced QB',
    definition: 'A composite dominance metric summarizing overall quarterback impact into a single evaluative score. Designed for rankings, leaderboards, recruiting visibility, and comparative scouting.',
    source: 'Football Data Hub — Official Metric Definitions',
    caveats: 'Quarterback stats only. Formula not yet fully recovered — values displayed are from the original computation.',
  },

  // ── Team Analytics ───────────────────────────────────────────────────────

  {
    id: 'powerscore-team',
    name: 'PowerScore (Team)',
    category: 'Team Analytics',
    definition: 'A composite team dominance metric that summarizes overall team strength across a season. Accounts for wins, losses, and the quality of opponents faced. Intended for cross-division comparisons and historical rankings.',
    source: 'Football Data Hub — Official Metric Definitions',
    caveats: 'Available for 2021–2024. Formula not yet fully recovered — displayed values are from the original computation.',
  },
  {
    id: 'elo',
    name: 'ELO',
    category: 'Team Analytics',
    definition: 'A football-adapted Elo rating system modeled after chess Elo. Measures relative team strength dynamically over time, adjusting for opponent strength, expected outcome, actual result, and upset magnitude. Provides dynamic power rankings, matchup prediction, and longitudinal strength tracking.',
    formula: 'New ELO = Old ELO + K × (Result − Expected Result)',
    source: 'Football Data Hub — Official Metric Definitions',
    caveats: 'Available for 2021–2024. K-factor and full implementation details not yet recovered — displayed values are from the original computation and cannot currently be reproduced.',
  },
]
