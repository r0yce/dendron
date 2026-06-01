export type DendronTheme = {
    primaryColor: string;
    bodyBackground: string;
    componentBackground: string;
    layoutBodyBackground: string;
    borderRadiusBase: string;
    layoutHeaderBackground: string;
};
export declare class ThemeUtils {
    static getTheme(name: string): DendronTheme | undefined;
}
