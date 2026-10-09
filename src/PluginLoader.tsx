import { useParams } from "react-router";
import { Component, Suspense, lazy, useMemo, type ReactNode } from "react";
import { color, space, type } from "./common/tokens";

/** Centered, on-palette message, so the pane never reads as an unstyled page. */
const PaneMessage = ({ children }: { children: ReactNode }) => (
    <div
        style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: space.lg,
            background: color.surface,
            ...type.body,
            color: color.inkMuted,
            textAlign: "center",
        }}
    >
        {children}
    </div>
);

/**
 * Without this, any error thrown while rendering a plugin (or loading its
 * chunk) unmounts the whole React tree: the pane goes completely blank, with
 * no styling, no instructions, and nothing in it to say why.
 */
class PluginErrorBoundary extends Component<
    { children: ReactNode },
    { error: Error | null }
> {
    state = { error: null as Error | null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error) {
        console.error("Plugin failed to render", error);
    }

    render() {
        if (this.state.error) {
            return (
                <PaneMessage>
                    This plugin couldn't load. Try reloading the page.
                </PaneMessage>
            );
        }
        return this.props.children;
    }
}

export const PluginLoader = () => {
    const { pluginName } = useParams();

    // Memoized: a fresh lazy() per render would remount the plugin, and its
    // state with it, every time this component re-rendered.
    const PluginComponent = useMemo(
        () => lazy(() => import(`./plugins/${pluginName}/Plugin.tsx`)),
        [pluginName]
    );

    return (
        <PluginErrorBoundary key={pluginName}>
            <Suspense fallback={<PaneMessage>Loading…</PaneMessage>}>
                <PluginComponent />
            </Suspense>
        </PluginErrorBoundary>
    );
};
