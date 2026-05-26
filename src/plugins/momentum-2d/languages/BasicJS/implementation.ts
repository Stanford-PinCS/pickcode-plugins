type Vec2 = {
    x: number;
    y: number;
};

type OverlayPoint = Vec2 & {
    color?: string;
    radius?: number;
    label?: string;
};

type BodyInputs = {
    label: string;
    mass: number;
    radius: number;
    position: Vec2;
    velocity: Vec2;
    color: string;
};

type MomentumInputs = {
    width: number;
    height: number;
    restitution: number;
    friction: number;
    bodies: [BodyInputs, BodyInputs];
};

type BodyDerived = {
    label: string;
    mass: number;
    radius: number;
    color: string;
    initialPosition: Vec2;
    collisionPosition: Vec2 | null;
    initialVelocity: Vec2;
    finalVelocity: Vec2;
    momentumBefore: Vec2;
    momentumAfter: Vec2;
    kineticEnergyBefore: number;
    kineticEnergyAfter: number;
};

type MomentumDerived = {
    collisionOccurs: boolean;
    collisionTime: number | null;
    collisionPoint: Vec2 | null;
    collisionNormal: Vec2 | null;
    impulse: number;
    tangentialImpulse: number;
    frictionMode: "none" | "sticking" | "sliding";
    totalMass: number;
    totalMomentumBefore: Vec2;
    totalMomentumAfter: Vec2;
    centerOfMassVelocityBefore: Vec2;
    centerOfMassVelocityAfter: Vec2;
    totalKineticEnergyBefore: number;
    totalKineticEnergyAfter: number;
    kineticEnergyChange: number;
    fractionalKineticEnergyLoss: number;
    playbackDuration: number;
    bodies: [BodyDerived, BodyDerived];
};

type MomentumDisplayOptions = {
    showGuides: boolean;
    points: OverlayPoint[];
};

type ConfigureSimulationCommand = {
    type: "configureSimulation";
    inputs: MomentumInputs;
    derived: MomentumDerived;
    displayOptions: MomentumDisplayOptions;
};

type StartAnimationCommand = {
    type: "start";
};

type Message = ConfigureSimulationCommand | StartAnimationCommand;

type BodyInputOverride = Partial<Omit<BodyInputs, "position" | "velocity">> & {
    position?: Partial<Vec2>;
    velocity?: Partial<Vec2>;
};

type MomentumInputOverride = Partial<Omit<MomentumInputs, "bodies">> & {
    bodies?: [BodyInputOverride?, BodyInputOverride?] | BodyInputOverride[];
};

type MomentumModel = {
    inputs?: MomentumInputOverride;
    display?: Partial<MomentumDisplayOptions>;
};

type MomentumReport = {
    inputs: MomentumInputs;
    derived: MomentumDerived;
};

const EPSILON = 1e-8;
const COLLISION_CONTACT_TOLERANCE = 1e-3;
const MIN_PLAYBACK_DURATION = 4.5;
const COLLISION_BLEND_SECONDS = 0.42;
const POST_COLLISION_BUFFER_SECONDS = 2.6;
const DEFAULT_DISPLAY_OPTIONS: MomentumDisplayOptions = {
    showGuides: false,
    points: [],
};

const clamp = (value: number, minimum: number, maximum: number) =>
    Math.min(Math.max(value, minimum), maximum);

const sanitizeNumber = (value: number | undefined, fallback: number) =>
    Number.isFinite(value) ? value : fallback;

const cloneVec = (vector: Vec2): Vec2 => ({ x: vector.x, y: vector.y });

const toSolverPosition = (position: Vec2, height: number): Vec2 => ({
    x: position.x,
    y: height - position.y,
});

const toSolverVector = (vector: Vec2): Vec2 => ({
    x: vector.x,
    y: -vector.y,
});

const toUserPosition = (position: Vec2, height: number): Vec2 => ({
    x: position.x,
    y: height - position.y,
});

const toUserVector = (vector: Vec2): Vec2 => ({
    x: vector.x,
    y: -vector.y,
});

const add = (left: Vec2, right: Vec2): Vec2 => ({
    x: left.x + right.x,
    y: left.y + right.y,
});

const subtract = (left: Vec2, right: Vec2): Vec2 => ({
    x: left.x - right.x,
    y: left.y - right.y,
});

const scale = (vector: Vec2, amount: number): Vec2 => ({
    x: vector.x * amount,
    y: vector.y * amount,
});

const toSolverInputs = (inputs: MomentumInputs): MomentumInputs => ({
    width: inputs.width,
    height: inputs.height,
    restitution: inputs.restitution,
    friction: inputs.friction,
    bodies: inputs.bodies.map((body) => ({
        ...body,
        position: toSolverPosition(body.position, inputs.height),
        velocity: toSolverVector(body.velocity),
    })) as [BodyInputs, BodyInputs],
});

const dot = (left: Vec2, right: Vec2) => left.x * right.x + left.y * right.y;

const magnitude = (vector: Vec2) => Math.hypot(vector.x, vector.y);

const normalize = (vector: Vec2, fallback: Vec2): Vec2 => {
    const length = magnitude(vector);

    if (length <= EPSILON) {
        return cloneVec(fallback);
    }

    return scale(vector, 1 / length);
};

const perpendicular = (vector: Vec2): Vec2 => ({
    x: -vector.y,
    y: vector.x,
});

const momentum = (mass: number, velocity: Vec2): Vec2 => scale(velocity, mass);

const kineticEnergy = (mass: number, velocity: Vec2) =>
    0.5 * mass * dot(velocity, velocity);

const DEFAULT_BODIES: [BodyInputs, BodyInputs] = [
    {
        label: "A",
        mass: 1,
        radius: 34,
        position: { x: 200, y: 280 },
        velocity: { x: 210, y: 0 },
        color: "#38bdf8",
    },
    {
        label: "B",
        mass: 1,
        radius: 34,
        position: { x: 560, y: 328 },
        velocity: { x: 0, y: 0 },
        color: "#fb7185",
    },
];

const DEFAULT_INPUTS: MomentumInputs = {
    width: 960,
    height: 540,
    restitution: 0.92,
    friction: 0,
    bodies: DEFAULT_BODIES,
};

const cloneInputs = (inputs: MomentumInputs): MomentumInputs => ({
    width: inputs.width,
    height: inputs.height,
    restitution: inputs.restitution,
    friction: inputs.friction,
    bodies: inputs.bodies.map((body) => ({
        ...body,
        position: cloneVec(body.position),
        velocity: cloneVec(body.velocity),
    })) as [BodyInputs, BodyInputs],
});

const normalizeBody = (
    body: BodyInputOverride | undefined,
    fallback: BodyInputs,
    width: number,
    height: number
): BodyInputs => {
    const radius = clamp(
        sanitizeNumber(body?.radius, fallback.radius),
        16,
        70
    );

    return {
        label: body?.label?.trim() || fallback.label,
        mass: clamp(sanitizeNumber(body?.mass, fallback.mass), 0.25, 20),
        radius,
        position: {
            x: clamp(
                sanitizeNumber(body?.position?.x, fallback.position.x),
                0,
                width
            ),
            y: clamp(
                sanitizeNumber(body?.position?.y, fallback.position.y),
                0,
                height
            ),
        },
        velocity: {
            x: sanitizeNumber(body?.velocity?.x, fallback.velocity.x),
            y: sanitizeNumber(body?.velocity?.y, fallback.velocity.y),
        },
        color: body?.color?.trim() || fallback.color,
    };
};

const normalizeInputs = (inputs?: MomentumInputOverride): MomentumInputs => {
    const width = clamp(sanitizeNumber(inputs?.width, DEFAULT_INPUTS.width), 520, 1500);
    const height = clamp(
        sanitizeNumber(inputs?.height, DEFAULT_INPUTS.height),
        340,
        1000
    );

    return {
        width,
        height,
        restitution: clamp(
            sanitizeNumber(inputs?.restitution, DEFAULT_INPUTS.restitution),
            0,
            1
        ),
        friction: clamp(
            sanitizeNumber(inputs?.friction, DEFAULT_INPUTS.friction),
            0,
            2
        ),
        bodies: [
            normalizeBody(inputs?.bodies?.[0], DEFAULT_BODIES[0], width, height),
            normalizeBody(inputs?.bodies?.[1], DEFAULT_BODIES[1], width, height),
        ],
    };
};

const normalizeDisplayOptions = (
    display?: Partial<MomentumDisplayOptions>
): MomentumDisplayOptions => ({
    showGuides:
        typeof display?.showGuides === "boolean"
            ? display.showGuides
            : DEFAULT_DISPLAY_OPTIONS.showGuides,
    points: Array.isArray(display?.points)
        ? display.points
              .filter((point): point is OverlayPoint => !!point)
              .map((point) => ({
                  x: clamp(sanitizeNumber(point.x, 0), 0, 1500),
                  y: clamp(sanitizeNumber(point.y, 0), 0, 1000),
                  color:
                      typeof point.color === "string" && point.color.trim()
                          ? point.color
                          : "#f8fafc",
                  radius: clamp(sanitizeNumber(point.radius, 4), 2, 14),
                  label:
                      typeof point.label === "string" && point.label.trim()
                          ? point.label.trim().slice(0, 12)
                          : undefined,
              }))
        : DEFAULT_DISPLAY_OPTIONS.points,
});

type CollisionSolution = {
    collisionOccurs: boolean;
    collisionTime: number | null;
    collisionPoint: Vec2 | null;
    collisionNormal: Vec2 | null;
    impulse: number;
    tangentialImpulse: number;
    frictionMode: "none" | "sticking" | "sliding";
    collisionPositions: [Vec2 | null, Vec2 | null];
    finalVelocities: [Vec2, Vec2];
};

const noCollision = (
    bodyA: BodyInputs,
    bodyB: BodyInputs
): CollisionSolution => ({
    collisionOccurs: false,
    collisionTime: null,
    collisionPoint: null,
    collisionNormal: null,
    impulse: 0,
    tangentialImpulse: 0,
    frictionMode: "none",
    collisionPositions: [null, null],
    finalVelocities: [cloneVec(bodyA.velocity), cloneVec(bodyB.velocity)],
});

const applyCollisionImpulse = (
    inputs: MomentumInputs,
    bodyA: BodyInputs,
    bodyB: BodyInputs,
    collisionNormal: Vec2,
    relativeVelocity: Vec2
): Pick<
    CollisionSolution,
    "impulse" | "tangentialImpulse" | "frictionMode" | "finalVelocities"
> | null => {
    const relativeSpeedAlongNormal = dot(relativeVelocity, collisionNormal);

    if (relativeSpeedAlongNormal >= 0) {
        return null;
    }

    const inverseMassSum = 1 / bodyA.mass + 1 / bodyB.mass;
    const normalImpulseMagnitude =
        -((1 + inputs.restitution) * relativeSpeedAlongNormal) / inverseMassSum;
    const tangent = normalize(perpendicular(collisionNormal), { x: 0, y: 1 });
    const relativeSpeedAlongTangent = dot(relativeVelocity, tangent);
    const requiredTangentialImpulse =
        Math.abs(relativeSpeedAlongTangent) <= EPSILON
            ? 0
            : -relativeSpeedAlongTangent / inverseMassSum;
    const maxFrictionImpulse = inputs.friction * normalImpulseMagnitude;
    const canStick =
        Math.abs(requiredTangentialImpulse) <=
        maxFrictionImpulse + EPSILON;
    const frictionMode =
        Math.abs(relativeSpeedAlongTangent) <= EPSILON
            ? "none"
            : canStick
              ? "sticking"
              : "sliding";
    const tangentialImpulseMagnitude =
        frictionMode !== "sliding"
            ? requiredTangentialImpulse
            : -Math.sign(relativeSpeedAlongTangent) * Math.min(
                  maxFrictionImpulse,
                  Math.abs(requiredTangentialImpulse)
              );
    const totalImpulseVector = add(
        scale(collisionNormal, normalImpulseMagnitude),
        scale(tangent, tangentialImpulseMagnitude)
    );

    return {
        impulse: normalImpulseMagnitude,
        tangentialImpulse: tangentialImpulseMagnitude,
        frictionMode,
        finalVelocities: [
            subtract(bodyA.velocity, scale(totalImpulseVector, 1 / bodyA.mass)),
            add(bodyB.velocity, scale(totalImpulseVector, 1 / bodyB.mass)),
        ],
    };
};

const solveCollision = (inputs: MomentumInputs): CollisionSolution => {
    const [bodyA, bodyB] = inputs.bodies;
    const relativePosition = subtract(bodyB.position, bodyA.position);
    const relativeVelocity = subtract(bodyB.velocity, bodyA.velocity);
    const a = dot(relativeVelocity, relativeVelocity);
    const radiusSum = bodyA.radius + bodyB.radius;
    const initialSeparation = magnitude(relativePosition);

    if (initialSeparation <= radiusSum + COLLISION_CONTACT_TOLERANCE) {
        const collisionNormal = normalize(
            relativePosition,
            normalize(scale(relativeVelocity, -1), { x: 1, y: 0 })
        );
        const impulseResult = applyCollisionImpulse(
            inputs,
            bodyA,
            bodyB,
            collisionNormal,
            relativeVelocity
        );

        if (!impulseResult) {
            return noCollision(bodyA, bodyB);
        }

        const collisionPositionA = cloneVec(bodyA.position);
        const collisionPositionB = cloneVec(bodyB.position);
        const collisionPoint = add(
            collisionPositionA,
            scale(collisionNormal, bodyA.radius)
        );

        return {
            collisionOccurs: true,
            collisionTime: 0,
            collisionPoint,
            collisionNormal,
            impulse: impulseResult.impulse,
            tangentialImpulse: impulseResult.tangentialImpulse,
            frictionMode: impulseResult.frictionMode,
            collisionPositions: [collisionPositionA, collisionPositionB],
            finalVelocities: impulseResult.finalVelocities,
        };
    }

    if (a <= EPSILON) {
        return noCollision(bodyA, bodyB);
    }

    const b = 2 * dot(relativePosition, relativeVelocity);
    const c = dot(relativePosition, relativePosition) - radiusSum * radiusSum;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < -COLLISION_CONTACT_TOLERANCE) {
        return noCollision(bodyA, bodyB);
    }

    const safeDiscriminant = Math.max(discriminant, 0);
    const sqrtDiscriminant = Math.sqrt(safeDiscriminant);
    const candidateTimes = [
        (-b - sqrtDiscriminant) / (2 * a),
        (-b + sqrtDiscriminant) / (2 * a),
    ].filter((time) => time >= 0);

    if (candidateTimes.length === 0) {
        return noCollision(bodyA, bodyB);
    }

    const collisionTime = Math.min(...candidateTimes);


    const collisionPositionA = add(bodyA.position, scale(bodyA.velocity, collisionTime));
    const collisionPositionB = add(bodyB.position, scale(bodyB.velocity, collisionTime));
    const separationAtCollision = subtract(collisionPositionB, collisionPositionA);

    if (
        Math.abs(magnitude(separationAtCollision) - radiusSum) >
        COLLISION_CONTACT_TOLERANCE
    ) {
        return noCollision(bodyA, bodyB);
    }

    const collisionNormal = normalize(
        separationAtCollision,
        normalize(scale(relativeVelocity, -1), { x: 1, y: 0 })
    );
    const impulseResult = applyCollisionImpulse(
        inputs,
        bodyA,
        bodyB,
        collisionNormal,
        relativeVelocity
    );

    if (!impulseResult) {
        return noCollision(bodyA, bodyB);
    }

    const collisionPoint = add(
        collisionPositionA,
        scale(collisionNormal, bodyA.radius)
    );

    return {
        collisionOccurs: true,
        collisionTime,
        collisionPoint,
        collisionNormal,
        impulse: impulseResult.impulse,
        tangentialImpulse: impulseResult.tangentialImpulse,
        frictionMode: impulseResult.frictionMode,
        collisionPositions: [collisionPositionA, collisionPositionB],
        finalVelocities: impulseResult.finalVelocities,
    };
};

const buildBodyDerived = (
    body: BodyInputs,
    finalVelocity: Vec2,
    collisionPosition: Vec2 | null
): BodyDerived => ({
    label: body.label,
    mass: body.mass,
    radius: body.radius,
    color: body.color,
    initialPosition: cloneVec(body.position),
    collisionPosition: collisionPosition ? cloneVec(collisionPosition) : null,
    initialVelocity: cloneVec(body.velocity),
    finalVelocity: cloneVec(finalVelocity),
    momentumBefore: momentum(body.mass, body.velocity),
    momentumAfter: momentum(body.mass, finalVelocity),
    kineticEnergyBefore: kineticEnergy(body.mass, body.velocity),
    kineticEnergyAfter: kineticEnergy(body.mass, finalVelocity),
});

const buildReport = (model?: MomentumModel): MomentumReport => {
    const inputs = normalizeInputs(model?.inputs);
    const solverInputs = toSolverInputs(inputs);
    const solution = solveCollision(solverInputs);
    const [bodyA, bodyB] = inputs.bodies;
    const [solverFinalVelocityA, solverFinalVelocityB] = solution.finalVelocities;
    const finalVelocityA = toUserVector(solverFinalVelocityA);
    const finalVelocityB = toUserVector(solverFinalVelocityB);
    const [solverCollisionPositionA, solverCollisionPositionB] = solution.collisionPositions;
    const collisionPositionA = solverCollisionPositionA
        ? toUserPosition(solverCollisionPositionA, inputs.height)
        : null;
    const collisionPositionB = solverCollisionPositionB
        ? toUserPosition(solverCollisionPositionB, inputs.height)
        : null;
    const bodyADerived = buildBodyDerived(bodyA, finalVelocityA, collisionPositionA);
    const bodyBDerived = buildBodyDerived(bodyB, finalVelocityB, collisionPositionB);
    const totalMomentumBefore = add(
        bodyADerived.momentumBefore,
        bodyBDerived.momentumBefore
    );
    const totalMomentumAfter = add(
        bodyADerived.momentumAfter,
        bodyBDerived.momentumAfter
    );
    const totalMass = bodyA.mass + bodyB.mass;
    const centerOfMassVelocityBefore =
        totalMass > EPSILON
            ? scale(totalMomentumBefore, 1 / totalMass)
            : { x: 0, y: 0 };
    const centerOfMassVelocityAfter =
        totalMass > EPSILON
            ? scale(totalMomentumAfter, 1 / totalMass)
            : { x: 0, y: 0 };
    const totalKineticEnergyBefore =
        bodyADerived.kineticEnergyBefore + bodyBDerived.kineticEnergyBefore;
    const totalKineticEnergyAfter =
        bodyADerived.kineticEnergyAfter + bodyBDerived.kineticEnergyAfter;
    const kineticEnergyChange =
        totalKineticEnergyAfter - totalKineticEnergyBefore;
    const fractionalKineticEnergyLoss =
        totalKineticEnergyBefore > EPSILON
            ? (totalKineticEnergyBefore - totalKineticEnergyAfter) /
              totalKineticEnergyBefore
            : 0;
    const nominalPlaybackDuration =
        solution.collisionOccurs && solution.collisionTime !== null
            ? Math.max(
                  solution.collisionTime +
                      COLLISION_BLEND_SECONDS +
                      POST_COLLISION_BUFFER_SECONDS,
                  MIN_PLAYBACK_DURATION
              )
            : MIN_PLAYBACK_DURATION;
    const playbackDuration = nominalPlaybackDuration;

    return {
        inputs,
        derived: {
            collisionOccurs: solution.collisionOccurs,
            collisionTime: solution.collisionTime,
            collisionPoint: solution.collisionPoint
                ? toUserPosition(solution.collisionPoint, inputs.height)
                : null,
            collisionNormal: solution.collisionNormal
                ? toUserVector(solution.collisionNormal)
                : null,
            impulse: solution.impulse,
            tangentialImpulse: solution.tangentialImpulse,
            frictionMode: solution.frictionMode,
            totalMass,
            totalMomentumBefore,
            totalMomentumAfter,
            centerOfMassVelocityBefore,
            centerOfMassVelocityAfter,
            totalKineticEnergyBefore,
            totalKineticEnergyAfter,
            kineticEnergyChange,
            fractionalKineticEnergyLoss,
            playbackDuration,
            bodies: [bodyADerived, bodyBDerived],
        },
    };
};

const createExports = (sendMessage: (message: Message) => void) => {
    const sendConfiguredSimulation = (model?: MomentumModel) => {
        const report = buildReport(model);
        const displayOptions = normalizeDisplayOptions(model?.display);
        sendMessage({
            type: "configureSimulation",
            inputs: report.inputs,
            derived: report.derived,
            displayOptions,
        });
        return report;
    };

    const buildDisplayPoints = (
        beforePoints: Vec2[] = [],
        afterPoints: Vec2[] = []
    ): OverlayPoint[] => [
        ...beforePoints.map((point) => ({
            ...point,
            color: "#38bdf8",
            radius: 2,
        })),
        ...afterPoints.map((point) => ({
            ...point,
            color: "#f59e0b",
            radius: 2,
        })),
    ];

    return Promise.resolve({
        momentum2d: {
            defaultInputs: cloneInputs(DEFAULT_INPUTS),
            createModel: (model?: MomentumModel) => ({
                inputs: normalizeInputs(model?.inputs),
                display: normalizeDisplayOptions(model?.display),
            }),
            buildDisplayPoints,
            preview: (model?: MomentumModel) => buildReport(model),
            run: (model?: MomentumModel) => {
                const report = sendConfiguredSimulation(model);
                sendMessage({ type: "start" });
                return report;
            },
            configure: (inputs: MomentumInputOverride) =>
                sendConfiguredSimulation({ inputs }),
            start: () => sendMessage({ type: "start" }),
        },
    });
};

export default createExports;