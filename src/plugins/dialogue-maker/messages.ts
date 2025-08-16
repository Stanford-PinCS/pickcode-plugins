type Choice = {
    response: string;
    nextScene: string;
};
type Scene = {
    message: string;
    choices: Choice[];
};
type Scenes = Record<string, Scene>;

type ScenesMessage = {
    scenes: Scenes;
};

export { Choice, Scene, Scenes, ScenesMessage };
