import type { PostcodeHuisnummer } from "@/helpers/validation";
import {
  fetchLoggedIn,
  throwIfNotOk,
  parseJson,
  parsePagination,
  ServiceResult,
  coerceToSingle,
} from "@/services";
import { mutate } from "swrv";
import type { Ref } from "vue";
import type { Persoon } from "../types";

export const personenRootUrl =
  window.gatewayBaseUri + "/api/ingeschrevenpersonen";

type QueryParam = [string, string][];

type SearchPersoonFieldParams = {
  bsn: string;
  geboortedatum: Date;
  postcodeHuisnummer: PostcodeHuisnummer;
};

type PersoonSearchField = keyof SearchPersoonFieldParams;

type QueryDictionary = {
  [K in PersoonSearchField]: (
    search: SearchPersoonFieldParams[K]
  ) => QueryParam;
};

export type PersoonSearch<K extends PersoonSearchField> = {
  searchField: K;
  query: SearchPersoonFieldParams[K];
};

const queryDictionary: QueryDictionary = {
  bsn: (search) => [["burgerservicenummer", search]],
  geboortedatum: (search) => [
    ["geboorte.datum.datum", search.toISOString().substring(0, 10)],
  ],
  postcodeHuisnummer: ({ postcode, huisnummer }) => [
    ["verblijfplaats.postcode", postcode.numbers + postcode.digits],

    ["verblijfplaats.huisnummer", huisnummer],
  ],
};

function getQueryParams<K extends PersoonSearchField>(
  params: PersoonSearch<K>
) {
  return queryDictionary[params.searchField](params.query) as ReturnType<
    QueryDictionary[K]
  >;
}

function mapPersoon(json: any): Persoon {
  const { verblijfplaats, naam, geboorte } = json?.embedded ?? {};
  const { datum, plaats, land } = geboorte?.embedded ?? {};
  const geboortedatum =
    datum && new Date(datum.jaar, datum.maand - 1, datum.dag);
  return {
    _brand: "persoon",
    postcode: verblijfplaats?.postcode,
    huisnummer: verblijfplaats?.huisnummer?.toString(),
    bsn: json?.burgerservicenummer,
    geboortedatum,
    voornaam: naam?.voornamen,
    voorvoegselAchternaam: naam?.voorvoegsel,
    achternaam: naam?.geslachtsnaam,
    geboorteplaats: plaats,
    geboorteland: land,
  };
}

export function getPersoonSearchUrl<K extends PersoonSearchField>(
  search: PersoonSearch<K> | undefined,
  page: number | undefined
) {
  if (!search) return "";
  const url = new URL(personenRootUrl);
  getQueryParams<K>(search).forEach((tuple) => {
    url.searchParams.set(...tuple);
  });
  url.searchParams.set("extend[]", "all");
  url.searchParams.set("page", page?.toString() ?? "1");
  return url.toString();
}

export function getPersoonUrlByBsn(bsn: string) {
  if (!bsn) return "";
  const url = new URL(personenRootUrl);
  url.searchParams.set("burgerservicenummer", bsn);
  url.searchParams.set("extend[]", "all");
  return url.toString();
}

export const searchPersonen = (url: string) => {
  return fetchLoggedIn(url)
    .then(throwIfNotOk)
    .then(parseJson)
    .then((p) => parsePagination(p, mapPersoon))
    .then((p) => {
      p.page.forEach((persoon) => {
        mutate(getPersoonUrlByBsn(persoon.bsn), persoon);
      });
      return p;
    });
};

export function usePersoonByBsn(bsn: Ref<string>) {
  const getUrl = () => getPersoonUrlByBsn(bsn.value);
  const paginated = ServiceResult.fromFetcher(getUrl, searchPersonen);
  return coerceToSingle(paginated);
}
