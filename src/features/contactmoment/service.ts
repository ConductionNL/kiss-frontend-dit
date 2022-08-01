import {
  parsePaginationAsync,
  ServiceResult,
  type Paginated,
} from "@/services";
import { fetchLoggedIn } from "@/services";
import type { Ref } from "vue";
import type {
  ContactmomentViewModel,
  Contactmoment,
  Gespreksresultaat,
} from "./types";

export function useContactmomentService() {
  if (!window.gatewayBaseUri) {
    console.error("gatewayBaseUri missing");
  }

  const contactmomentenUrl = window.gatewayBaseUri + "/api/contactmomenten";

  const gespreksResultatenBaseUri =
    window.gatewayBaseUri + "/api/ref/resultaattypeomschrijvingen";

  const save = (data: Contactmoment) => {
    return fetchLoggedIn(contactmomentenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((r) => {
      if (!r.ok) {
        throw new Error();
      }
      return r.json();
    });
  };

  const getGespreksResultaten = () => {
    const fetchBerichten = fetchLoggedIn(gespreksResultatenBaseUri)
      .then((r) => {
        if (!r.ok) {
          throw new Error(
            "Er is een fout opgetreden bij het laden van de gespreksresultaten"
          );
        }
        return r.json();
      })
      .then((json) => {
        const results = json?.results;
        if (!Array.isArray(results))
          throw new Error("unexpected json result: " + JSON.stringify(json));
        return results as Array<Gespreksresultaat>;
      });

    return ServiceResult.fromPromise(fetchBerichten);
  };

  return {
    save,
    getGespreksResultaten,
    // saveZaak,
  };
}

export function useKlantContactmomenten(id: Ref<string>) {
  const getUrl = () => {
    const { value } = id;
    if (!value) return "";

    const url = new URL(window.gatewayBaseUri + "/api/klantcontactmomenten");
    url.searchParams.set("klant.id", value);
    url.searchParams.set("extend[]", "contactmoment.objectcontactmomenten");
    url.searchParams.set("fields[]", "contactmoment");
    return url.toString();
  };

  return ServiceResult.fromFetcher(getUrl, fetchKlantContactmomenten);
}

const mapZaak = (result: any) => ({
  status: result.embedded.status.statustoelichting,
  zaaktype: result.embedded.zaaktype.onderwerp,
  zaaknummer: result.identificatie,
});

const fetchZaak = (o: { object: string }) =>
  fetchLoggedIn(window.gatewayBaseUri + o.object)
    .then((or) => or.json())
    .then(mapZaak);

const fetchZaken = (c: any) =>
  Promise.all(
    c.embedded.objectcontactmomenten
      .filter((x: any) => x.objectType === "zaak")
      .map(fetchZaak)
  );

const mapContactmomentAsync = (r: any) => {
  const contactmoment = r.embedded.contactmoment as ContactmomentViewModel;
  return fetchZaken(contactmoment).then((zaken) => ({
    ...contactmoment,
    zaken,
  }));
};

function fetchKlantContactmomenten(
  url: string
): Promise<Paginated<ContactmomentViewModel>> {
  return fetchLoggedIn(url)
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((json) => parsePaginationAsync(json, mapContactmomentAsync));
}
