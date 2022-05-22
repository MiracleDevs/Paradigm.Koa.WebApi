import { ActionType } from "./action-type";
import { ObjectType } from "@miracledevs/paradigm-web-di";

export enum RouteParameterType {
    Segment,
    QueryStringVariable,
}

class RouteParameter<T = any> {
    constructor(public readonly name: string, public readonly dataType: ObjectType<T>, public readonly parameterType: RouteParameterType) {}
}

const UrlRegEx = {
    UrlExpression: /[^\/?]+/gi,
    QueryStringExpression: /[^\?\&?]+/gi,

    execute: (regex: RegExp, value: string): string[] => {
        if (!value) return [];

        let matches: RegExpExecArray | null;
        let results = [];

        while ((matches = regex.exec(value))) {
            results.push(matches[0]);
        }

        return results;
    },
};

export class ActionUrl {
    public readonly segments: string[];

    public readonly queryString: string[];

    public readonly parameters: RouteParameter[];

    private constructor() {
        this.segments = [];
        this.queryString = [];
        this.parameters = [];
    }

    static parse(url: string, query: string, actionType: ActionType): ActionUrl {
        if (!actionType) throw new Error("Can't create an action url without an action type.");

        const actionUrl = new ActionUrl();

        if (!url && !query) return actionUrl;

        url = url || "";
        query = query || "";

        const segments = UrlRegEx.execute(UrlRegEx.UrlExpression, url);
        const variables = UrlRegEx.execute(UrlRegEx.QueryStringExpression, query);
        let typeIndex = 0;

        segments.forEach(x => actionUrl.segments.push(x));
        variables.forEach(x => actionUrl.queryString.push(x));

        for (const part of segments) {
            if (!part.startsWith(":")) continue;

            actionUrl.parameters.push(new RouteParameter(part.substr(1, part.length - 1), actionType.parameters[typeIndex++], RouteParameterType.Segment));
        }

        for (const part of variables) {
            if (!part.startsWith(":")) continue;

            actionUrl.parameters.push(new RouteParameter(part.substr(1, part.length - 1), actionType.parameters[typeIndex++], RouteParameterType.QueryStringVariable));
        }

        return actionUrl;
    }
}
