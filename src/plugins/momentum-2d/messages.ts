export type Vec2 = {
    x: number;
    y: number;
};

export type OverlayPoint = Vec2 & {
    color?: string;
    radius?: number;
    label?: string;
};

export type BodyInputs = {
    label: string;
    mass: number;
    radius: number;
    position: Vec2;
    velocity: Vec2;
    color: string;
};

export type MomentumInputs = {
    width: number;
    height: number;
    restitution: number;
    friction: number;
    bodies: [BodyInputs, BodyInputs];
};

export type BodyDerived = {
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

export type MomentumDerived = {
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

export type MomentumDisplayOptions = {
    showGuides: boolean;
    points: OverlayPoint[];
};

export type ConfigureSimulationCommand = {
    type: "configureSimulation";
    inputs: MomentumInputs;
    derived: MomentumDerived;
    displayOptions: MomentumDisplayOptions;
};

export type StartAnimationCommand = {
    type: "start";
};

export type Message = ConfigureSimulationCommand | StartAnimationCommand;