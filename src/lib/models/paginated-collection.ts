import { KeyNotFoundError } from "../errors/key-not-found.error";
import { INormalized } from "../interfaces/normalized.interface";
import { IPaginatedObject } from "../interfaces/paginated-object.interface";

export class PaginatedCollection<T extends IPaginatedObject> {
    constructor(
        public data: T[],
        public readonly page: number,
        public readonly from?: number,
        public readonly to?: number,
        public readonly total?: number,
        public readonly perPage?: number,
        public readonly prevPageUrl?: string,
        public readonly nextPageUrl?: string,
        public readonly lastPage?: number,
        public readonly firstPageUrl?: string,
        public readonly lastPageUrl?: string
    ) {
        //
    }

    /**
     * Normalize the collection to a paginated list of ids for state-managed applications.
     * 
     * This method returns a single key object, where the key is the page number and the associated value is
     * an array of ids. Each id is fetched by the collection items, looking up for the "id" key. If an id is supplied
     * to this method, it will be used instead of the default "id" key.
     * 
     * Please note that in case the key doesn't exist in the collection's item, a KeyNotFoundError is thrown
     * 
     * @param k A key to use instead of the default "id": this will be searched inside each element of the collection
     * @returns []
     * @throws KeyNotFoundItem
     */
    public normalize(id?: string): INormalized {
        return {
            [this.page]: this.data.reduce((ids: number[], value: T) => {
                if (id && id in value) {
                    ids.push(value[id]);
                } else if (value.hasOwnProperty('id')) {
                    ids.push(value['id']);
                } else {
                    throw new KeyNotFoundError(id || 'id');
                }

                return ids;
            }, [])
        }
    }
}