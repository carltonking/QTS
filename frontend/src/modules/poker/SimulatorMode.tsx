import { useEffect, useState } from "react";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { CardComponent } from "./CardComponent";
import RangeChart from "./RangeChart";
import { Deck } from "./engine/Deck";
import { HandEvaluator } from "./engine/HandEvaluator";
import type { Card as PokerCard, Position, Rank } from "./engine/types";

type SessionMode = "PRACTICE" | "PLAY";
type SimulatorSubMode = "FULL_HAND" | "PREFLOP" | "FLOP" | "POSTFLOP";
type HeroAction = "FOLD" | "CALL" | "RAISE";
type Seat = {
  id: string;
  name: string;
  stack: number;
  position: Position;
  holeCards: [PokerCard, PokerCard];
  isHero: boolean;
  seatClass: string;
};

type FullHandSeed = {
  seats: Seat[];
  heroPosition: Position;
  board: [PokerCard, PokerCard, PokerCard, PokerCard, PokerCard];
};

type ScenarioData = {
  key: string;
  street: "PREFLOP" | "FLOP" | "TURN" | "RIVER";
  heroPosition: Position;
  heroCards: [PokerCard, PokerCard];
  communityCards: PokerCard[];
  seats: Seat[];
  potSize: number;
  betSize: number;
  facingRaise: boolean;
  actionLabel: string;
  correctAction: HeroAction;
  explanation: string;
  percentile: number;
  boardTexture: string;
};

type SimulatorModeProps = {
  sessionMode: SessionMode;
  timeLimitSec: number | null;
  onScoredResult: (correct: boolean) => void;
};

const POSITIONS: Position[] = ["BTN", "SB", "BB", "UTG", "MP", "CO"];
const SEAT_LAYOUT = [
  "poker-seat-top-left",
  "poker-seat-top-center",
  "poker-seat-top-right",
  "poker-seat-middle-left",
  "poker-seat-middle-right",
];
const RANK_VALUE: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

function rankScore(cards: [PokerCard, PokerCard]): number {
  const [first, second] = cards;
  const high = Math.max(RANK_VALUE[first.rank], RANK_VALUE[second.rank]);
  const low = Math.min(RANK_VALUE[first.rank], RANK_VALUE[second.rank]);
  const paired = first.rank === second.rank;
  const suited = first.suit === second.suit;
  const connected = Math.abs(high - low) <= 1;
  let raw = high * 4 + low * 2;

  if (paired) raw += 26;
  if (suited) raw += 6;
  if (connected) raw += 4;
  if (high === 14) raw += 4;
  if (high >= 10 && low >= 10) raw += 3;

  return Math.max(0, Math.min(100, Math.round((raw / 92) * 100)));
}

function isInPosition(position: Position): boolean {
  return position === "BTN" || position === "CO";
}

function shufflePositions(): Position[] {
  const positions = [...POSITIONS];

  for (let index = positions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = positions[index];
    positions[index] = positions[swapIndex];
    positions[swapIndex] = current;
  }

  return positions;
}

function dealSeats(deck: Deck): { seats: Seat[]; heroPosition: Position } {
  const positions = shufflePositions();
  const heroPosition = positions[0];
  const heroCards = deck.deal(2) as [PokerCard, PokerCard];
  const seats: Seat[] = [
    {
      id: "hero",
      name: "HERO",
      stack: 100,
      position: heroPosition,
      holeCards: heroCards,
      isHero: true,
      seatClass: "poker-seat-hero",
    },
  ];

  for (let index = 0; index < 5; index += 1) {
    seats.push({
      id: `villain-${index + 1}`,
      name: `VILLAIN ${index + 1}`,
      stack: 60 + Math.round(Math.random() * 80),
      position: positions[index + 1],
      holeCards: deck.deal(2) as [PokerCard, PokerCard],
      isHero: false,
      seatClass: SEAT_LAYOUT[index],
    });
  }

  return { seats, heroPosition };
}

function buildIndependentScenario(
  subMode: Exclude<SimulatorSubMode, "FULL_HAND">,
): ScenarioData {
  const deck = new Deck();
  deck.shuffle();

  const { seats, heroPosition } = dealSeats(deck);
  const heroCards = seats[0].holeCards;
  const communityCards =
    subMode === "PREFLOP"
      ? []
      : subMode === "FLOP"
        ? deck.deal(3)
        : Math.random() > 0.5
          ? deck.deal(4)
          : deck.deal(5);

  const street: ScenarioData["street"] =
    subMode === "PREFLOP"
      ? "PREFLOP"
      : communityCards.length === 3
        ? "FLOP"
        : communityCards.length === 4
          ? "TURN"
          : "RIVER";

  return resolveDecision({
    key: `independent-${subMode}-${Date.now()}-${Math.random()}`,
    street,
    heroPosition,
    heroCards,
    communityCards,
    seats,
  });
}

function createFullHandSeed(): FullHandSeed {
  const deck = new Deck();
  deck.shuffle();
  const { seats, heroPosition } = dealSeats(deck);
  const board = deck.deal(5) as [
    PokerCard,
    PokerCard,
    PokerCard,
    PokerCard,
    PokerCard,
  ];
  return {
    seats,
    heroPosition,
    board,
  };
}

function buildFullHandScenario(
  seed: FullHandSeed,
  stageIndex: number,
): ScenarioData {
  const street: ScenarioData["street"] =
    stageIndex === 0
      ? "PREFLOP"
      : stageIndex === 1
        ? "FLOP"
        : stageIndex === 2
          ? "TURN"
          : "RIVER";
  const communityCards =
    stageIndex === 0
      ? []
      : stageIndex === 1
        ? seed.board.slice(0, 3)
        : stageIndex === 2
          ? seed.board.slice(0, 4)
          : seed.board;

  return resolveDecision({
    key: `full-${stageIndex}-${seed.board.map((card) => `${card.rank}${card.suit}`).join("")}`,
    street,
    heroPosition: seed.heroPosition,
    heroCards: seed.seats[0].holeCards,
    communityCards,
    seats: seed.seats,
  });
}

function percentileFromHand(
  heroCards: [PokerCard, PokerCard],
  communityCards: PokerCard[],
): number {
  if (communityCards.length === 0) {
    return rankScore(heroCards);
  }

  const hand = HandEvaluator.evaluate([...heroCards, ...communityCards]);
  return Math.max(
    0,
    Math.min(100, Math.round(((7463 - hand.rank) / 7462) * 100)),
  );
}

function resolveDecision(
  base: Omit<
    ScenarioData,
    | "potSize"
    | "betSize"
    | "facingRaise"
    | "actionLabel"
    | "correctAction"
    | "explanation"
    | "percentile"
    | "boardTexture"
  >,
): ScenarioData {
  const percentile = percentileFromHand(base.heroCards, base.communityCards);
  const street = base.street;
  const facingRaise =
    street === "PREFLOP" ? Math.random() > 0.4 : Math.random() > 0.2;
  const potSize =
    street === "PREFLOP"
      ? Number((2.5 + Math.random() * 6.5).toFixed(1))
      : Number((6 + Math.random() * 28).toFixed(1));
  const betSize = facingRaise
    ? Number(
        (street === "PREFLOP"
          ? 2 + Math.random() * 4
          : potSize *
            (Math.random() > 0.75 ? 1.2 : Math.random() > 0.4 ? 0.75 : 0.5)
        ).toFixed(1),
      )
    : 0;
  const texture =
    base.communityCards.length > 0
      ? HandEvaluator.classifyBoardTexture(base.communityCards).label
      : "NO BOARD";
  const actionLabel = facingRaise
    ? street === "PREFLOP"
      ? `FACING ${betSize.toFixed(1)} BB OPEN`
      : `FACING ${betSize.toFixed(1)} BB BET`
    : "CHECKED TO YOU";

  if (street === "PREFLOP") {
    let correctAction: HeroAction;

    if (percentile >= 70) {
      correctAction = "RAISE";
    } else if (percentile >= 55) {
      correctAction = isInPosition(base.heroPosition) ? "RAISE" : "CALL";
    } else if (percentile >= 40) {
      correctAction = base.heroPosition === "BTN" ? "RAISE" : "CALL";
    } else {
      correctAction = facingRaise ? "FOLD" : "CALL";
    }

    const explanation = `YOUR ${percentile}TH PERCENTILE STARTING HAND FROM ${base.heroPosition} ${
      correctAction === "RAISE"
        ? "WANTS TO BUILD THE POT AND CAPTURE POSITIONAL EDGE."
        : correctAction === "CALL"
          ? "REALIZES EQUITY BETTER AS A FLAT OR CHECK-CALL THAN AS A PURE OPEN."
          : "SITS TOO LOW IN RANGE TO CONTINUE AGAINST PRESSURE PROFITABLY."
    } ${facingRaise ? `YOU ARE FACING ${betSize.toFixed(1)} BB INTO ${potSize.toFixed(1)} BB.` : "NO RAISE HAS OCCURRED YET."}`;

    return {
      ...base,
      potSize,
      betSize,
      facingRaise,
      actionLabel,
      correctAction,
      explanation,
      percentile,
      boardTexture: texture,
    };
  }

  let correctAction: HeroAction;

  if (percentile >= 80) {
    correctAction = "RAISE";
  } else if (percentile >= 40) {
    correctAction = !facingRaise || betSize <= potSize * 0.75 ? "CALL" : "FOLD";
  } else {
    correctAction = facingRaise ? "FOLD" : "CALL";
  }

  const explanation = `WITH ${percentile}TH PERCENTILE SHOWDOWN VALUE ON A ${texture} BOARD, ${
    correctAction === "RAISE"
      ? "YOUR RANGE WANTS TO PRESS VALUE AND DENY EQUITY."
      : correctAction === "CALL"
        ? "YOU HAVE ENOUGH EQUITY OR SHOWDOWN VALUE TO CONTINUE WITHOUT BLOATED AGGRESSION."
        : "THIS HAND DOES NOT MEET THE DEFENSE THRESHOLD AGAINST THE PRICE OFFERED."
  } ${facingRaise ? `VILLAIN IS BETTING ${betSize.toFixed(1)} BB INTO ${potSize.toFixed(1)} BB.` : "VILLAIN HAS CHECKED, SO CHECKING BACK IS FINE."}`;

  return {
    ...base,
    potSize,
    betSize,
    facingRaise,
    actionLabel,
    correctAction,
    explanation,
    percentile,
    boardTexture: texture,
  };
}

export default function SimulatorMode({
  sessionMode,
  timeLimitSec,
  onScoredResult,
}: SimulatorModeProps) {
  const [subMode, setSubMode] = useState<SimulatorSubMode>("FULL_HAND");
  const [fullHandSeed, setFullHandSeed] = useState<FullHandSeed>(() =>
    createFullHandSeed(),
  );
  const [fullHandStage, setFullHandStage] = useState(0);
  const [scenario, setScenario] = useState<ScenarioData>(() =>
    buildFullHandScenario(fullHandSeed, 0),
  );
  const [selectedAction, setSelectedAction] = useState<
    HeroAction | "TIMEOUT" | null
  >(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [handCount, setHandCount] = useState(0);
  const [buttonUnlocked, setButtonUnlocked] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(timeLimitSec ?? 0);

  const isCorrect =
    selectedAction !== null &&
    selectedAction !== "TIMEOUT" &&
    selectedAction === scenario.correctAction;
  const revealChart =
    selectedAction !== null && (sessionMode === "PRACTICE" || !isCorrect);

  const loadScenario = (
    mode: SimulatorSubMode,
    nextStage = 0,
    nextSeed?: FullHandSeed,
  ) => {
    if (mode === "FULL_HAND") {
      const seed = nextSeed ?? createFullHandSeed();
      setFullHandSeed(seed);
      setFullHandStage(nextStage);
      setScenario(buildFullHandScenario(seed, nextStage));
      return;
    }

    setScenario(buildIndependentScenario(mode));
  };

  useEffect(() => {
    if (subMode === "FULL_HAND") {
      loadScenario("FULL_HAND", 0, createFullHandSeed());
    } else {
      loadScenario(subMode);
    }
    setSelectedAction(null);
    setButtonUnlocked(true);
  }, [subMode]);

  useEffect(() => {
    if (
      sessionMode !== "PLAY" ||
      timeLimitSec === null ||
      selectedAction !== null
    ) {
      return;
    }

    setTimeLeft(timeLimitSec);
    const startedAt = Date.now();
    const durationMs = timeLimitSec * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, durationMs - (Date.now() - startedAt));
      setTimeLeft(remaining / 1000);

      if (remaining <= 0) {
        window.clearInterval(timer);
        setSelectedAction("TIMEOUT");
        setHandCount((current) => current + 1);
        onScoredResult(false);
        setButtonUnlocked(false);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [onScoredResult, scenario.key, selectedAction, sessionMode, timeLimitSec]);

  useEffect(() => {
    if (
      sessionMode !== "PLAY" ||
      !selectedAction ||
      selectedAction === scenario.correctAction
    ) {
      setButtonUnlocked(true);
      return;
    }

    setButtonUnlocked(false);
    const timeout = window.setTimeout(() => setButtonUnlocked(true), 2000);
    return () => window.clearTimeout(timeout);
  }, [scenario.correctAction, selectedAction, sessionMode]);

  const submit = (action: HeroAction) => {
    if (selectedAction !== null) {
      return;
    }

    const correct = action === scenario.correctAction;
    setSelectedAction(action);
    setHandCount((current) => current + 1);
    setCorrectCount((current) => current + (correct ? 1 : 0));
    onScoredResult(correct);
  };

  const nextScenario = () => {
    setSelectedAction(null);
    setButtonUnlocked(true);

    if (subMode === "FULL_HAND" && fullHandStage < 3) {
      const stage = fullHandStage + 1;
      setFullHandStage(stage);
      setScenario(buildFullHandScenario(fullHandSeed, stage));
      return;
    }

    if (subMode === "FULL_HAND") {
      const seed = createFullHandSeed();
      loadScenario("FULL_HAND", 0, seed);
      return;
    }

    loadScenario(subMode);
  };

  const accuracy = handCount > 0 ? (correctCount / handCount) * 100 : 0;
  const callButtonLabel = scenario.facingRaise ? "CALL" : "CHECK / CALL";
  const timerPercent = timeLimitSec
    ? Math.max(0, (timeLeft / timeLimitSec) * 100)
    : 100;

  return (
    <div className="poker-mode-layout">
      <Card className="poker-mode-shell">
        <div className="poker-mode-header">
          <Badge label="Simulator" />
          <div className="poker-pill-row">
            {(["FULL_HAND", "PREFLOP", "FLOP", "POSTFLOP"] as const).map(
              (mode) => (
                <Button
                  key={mode}
                  variant={subMode === mode ? "default" : "ghost"}
                  onClick={() => setSubMode(mode)}
                >
                  {mode.replace("_", " ")}
                </Button>
              ),
            )}
          </div>
        </div>

        <div className="poker-stats-strip">
          <span>HANDS {handCount}</span>
          <span>CORRECT {accuracy.toFixed(0)}%</span>
          <span>
            {sessionMode === "PLAY" && timeLimitSec
              ? `${Math.ceil(timeLeft)}S LEFT`
              : "NO TIMER"}
          </span>
        </div>

        {sessionMode === "PLAY" && timeLimitSec ? (
          <div className="poker-timer-bar">
            <div
              className="poker-timer-fill"
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        ) : null}

        <div className="poker-simulator-grid">
          <div className="poker-table-shell">
            <div className="poker-table-oval">
              {scenario.seats.slice(1).map((seat) => (
                <div key={seat.id} className={`poker-seat ${seat.seatClass}`}>
                  <div className="poker-seat-name">{seat.name}</div>
                  <div className="poker-seat-meta">{seat.stack} BB</div>
                  <div className="poker-seat-cards">
                    <CardComponent faceDown size="sm" />
                    <CardComponent faceDown size="sm" />
                  </div>
                  <Badge label={seat.position} size="sm" />
                </div>
              ))}

              <div className="poker-seat poker-seat-hero">
                <div className="poker-seat-name">HERO</div>
                <div className="poker-seat-meta">100 BB</div>
                <div className="poker-seat-cards">
                  {scenario.heroCards.map((card, index) => (
                    <CardComponent
                      key={`hero-${index}`}
                      card={card}
                      size="lg"
                    />
                  ))}
                </div>
                <Badge label={scenario.heroPosition} size="sm" />
              </div>

              <div className="poker-table-center">
                <div className="poker-pot-box">
                  POT {scenario.potSize.toFixed(1)} BB
                </div>
                <div className="poker-board-row">
                  {scenario.communityCards.length > 0 ? (
                    scenario.communityCards.map((card, index) => (
                      <CardComponent
                        key={`board-${index}`}
                        card={card}
                        size="md"
                      />
                    ))
                  ) : (
                    <div className="poker-board-empty">PREFLOP</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="poker-scenario-column">
            <Card className="poker-info-card">
              <div className="poker-info-grid">
                <div className="poker-info-row">
                  <span>STREET</span>
                  <span>{scenario.street}</span>
                </div>
                <div className="poker-info-row">
                  <span>ACTION</span>
                  <span>{scenario.actionLabel}</span>
                </div>
                <div className="poker-info-row">
                  <span>BOARD</span>
                  <span>{scenario.boardTexture}</span>
                </div>
                <div className="poker-info-row">
                  <span>HAND SCORE</span>
                  <span>{scenario.percentile} / 100</span>
                </div>
              </div>
            </Card>

            <Card className="poker-action-card">
              <div className="poker-action-grid">
                <Button
                  onClick={() => submit("FOLD")}
                  disabled={selectedAction !== null}
                >
                  Fold
                </Button>
                <Button
                  onClick={() => submit("CALL")}
                  disabled={selectedAction !== null}
                >
                  {callButtonLabel}
                </Button>
                <Button
                  onClick={() => submit("RAISE")}
                  disabled={selectedAction !== null}
                >
                  Raise
                </Button>
              </div>

              {selectedAction ? (
                <div
                  className={`poker-feedback-box ${isCorrect ? "poker-feedback-hit" : "poker-feedback-miss"}`}
                >
                  <div>
                    {selectedAction === "TIMEOUT"
                      ? "TIME EXPIRED"
                      : isCorrect
                        ? "CORRECT"
                        : "INCORRECT"}
                  </div>
                  <div>
                    CORRECT ACTION:{" "}
                    {scenario.correctAction === "CALL" && !scenario.facingRaise
                      ? "CHECK / CALL"
                      : scenario.correctAction}
                  </div>
                </div>
              ) : null}

              {revealChart ? (
                <RangeChart
                  heroCards={scenario.heroCards}
                  heroPosition={scenario.heroPosition}
                  facingRaise={scenario.facingRaise}
                  correctAction={scenario.correctAction}
                  explanation={scenario.explanation}
                />
              ) : null}

              {selectedAction ? (
                <Button onClick={nextScenario} disabled={!buttonUnlocked}>
                  {subMode === "FULL_HAND" && fullHandStage < 3
                    ? "Next Street"
                    : "Next Scenario"}
                </Button>
              ) : null}
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}
