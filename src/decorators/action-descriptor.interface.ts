import { HttpMethod } from "../shared/http-method";
import { IFilter } from "../filters/filter.interface";
import { ObjectType } from "@miracledevs/paradigm-web-di";

export interface IActionDescriptor {
    method?: HttpMethod;
    route?: string;
    query?: string;
    fromBody?: boolean;
    filters?: ObjectType<IFilter>[];
}
