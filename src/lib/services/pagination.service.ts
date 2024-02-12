import { Inject, Injectable, Optional } from "@angular/core";
import { IPaginationConfig } from "../interfaces/pagination-config.interface";
import { PaginatedCollection } from "../models/paginated-collection";
import { ResponseOptions } from "../models/response-options";
import { IPaginatedObject } from "../interfaces/paginated-object.interface";

@Injectable()
export class PaginationService {
  private _options: ResponseOptions;
  
  constructor(@Inject('RESPONSE_OPTIONS') @Optional() options: IPaginationConfig = {}) {
    this._options = new ResponseOptions(options);
  }

  public paginate<T extends IPaginatedObject>(response: {[key: string]: any}): PaginatedCollection<T> {
    return new PaginatedCollection(
      response[this._options.data],
      response[this._options.currentPage],
      response[this._options.from],
      response[this._options.to],
      response[this._options.total],
      response[this._options.perPage],
      response[this._options.prevPageUrl],
      response[this._options.nextPageUrl],
      response[this._options.lastPage],
      response[this._options.firstPageUrl],
      response[this._options.lastPageUrl]
    );
  }
}