<template>
  <div class="home">
    <header>
      <utrecht-heading :level="1">Startscherm</utrecht-heading>
      <!-- Temporarily hide -->
      <a
        v-if="false"
        :href="pubBeheerUrl"
        rel="noopener noreferrer"
        target="_blank"
        class="admin-link"
        >Items beheren</a
      >
    </header>
    <menu class="forms">
      <li>
        <form
          ref="searchForm"
          enctype="application/x-www-form-urlencoded"
          method="get"
          @submit="handleSubmit"
          class="search-bar"
        >
          <label
            for="werkberichtTypeInput"
            v-if="berichtTypes.state === 'success'"
          >
            Naar welk type bericht ben je op zoek?
            <select
              name="type"
              id="werkberichtTypeInput"
              v-model="state.typeIdField"
            >
              <option :value="undefined">Alle</option>
              <option
                v-for="[key, label] in berichtTypes.data.entries"
                :key="`berichtTypes_${key}`"
                :value="key"
              >
                {{ label }}
              </option>
            </select>
          </label>
          <label for="searchInput"
            ><span>Zoek een werkinstructie of nieuwsbericht</span>
            <input
              type="search"
              name="search"
              id="searchInput"
              placeholder="Zoek een werkinstructie of nieuwsbericht"
              @search="handleSearch"
              v-model="state.searchField"
          /></label>
          <button title="Zoeken">
            <span>Zoeken</span>
          </button>
        </form>
      </li>
      <li>
        <form
          class="skills-form"
          method="get"
          v-if="skills.state === 'success'"
        >
          <multi-select
            name="skillIds"
            label="Filter op categorie"
            :options="skills.data.entries"
            v-model="userStore.preferences.skills"
          />
          <menu class="delete-skills-menu">
            <li
              v-for="{ id, name, className } in selectedSkills"
              :key="'skills_cb_' + id"
            >
              <button
                type="button"
                :class="`remove-filter icon-after circle-xmark ${className}`"
                @click="
                  userStore.preferences.skills =
                    userStore.preferences.skills.filter((x) => x !== id)
                "
              >
                <span>Verwijder filter op </span><span>{{ name }}</span>
              </button>
            </li>
          </menu>
        </form>
      </li>
    </menu>
    <werk-berichten
      v-if="state.currentSearch"
      :level="2"
      page-param-name="werkberichtsearchpage"
      :search="state.currentSearch"
      :skill-ids="userStore.preferences.skills"
      :type-id="state.currentTypeId"
      :current-page="state.searchPage"
      @navigate="state.searchPage = $event"
      header="Zoekresultaten"
    />
    <template v-else>
      <werk-berichten
        :level="2"
        v-if="nieuwsId"
        header="Nieuws"
        page-param-name="nieuwspage"
        :typeId="nieuwsId"
        :skill-ids="userStore.preferences.skills"
        :current-page="state.nieuwsPage"
        @navigate="state.nieuwsPage = $event"
      />
      <werk-berichten
        :level="2"
        v-if="werkInstructieId"
        header="Werkinstructies"
        page-param-name="werkinstructiepage"
        :typeId="werkInstructieId"
        :skill-ids="userStore.preferences.skills"
        :current-page="state.werkinstructiesPage"
        @navigate="state.werkinstructiesPage = $event"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { Heading as UtrechtHeading } from "@utrecht/component-library-vue";
import { computed } from "vue";
import {
  useBerichtTypes,
  useSkills,
  WerkBerichten,
} from "@/features/werkbericht";
import { parseValidInt } from "@/services";
import MultiSelect from "@/components/MultiSelect.vue";
import { useUserStore } from "@/stores/user";
import { ensureState } from "@/stores/create-store";

const { pubBeheerUrl } = window;

const werkinstructie = "werkinstructie";
const nieuws = "nieuws";

const state = ensureState({
  stateId: "HomeView",
  stateFactory() {
    return {
      searchField: "",
      typeIdField: undefined as number | undefined,
      currentSearch: "",
      currentTypeId: undefined as number | undefined,
      searchPage: 1,
      nieuwsPage: 1,
      werkinstructiesPage: 1,
    };
  },
});

const userStore = useUserStore();

const berichtTypes = useBerichtTypes();
const skills = useSkills();

const selectedSkills = computed(() => {
  if (skills.state !== "success") return undefined;
  return skills.data.entries
    .map(([id, name]) => ({
      id,
      name,
      className: `category-${name.split(" ").join("-")}`,
    }))
    .filter((x) => userStore.preferences.skills.includes(x.id));
});

const werkInstructieId = computed(
  () =>
    berichtTypes.state === "success" &&
    berichtTypes.data.fromValueToKey(werkinstructie)
);

const nieuwsId = computed(
  () =>
    berichtTypes.state === "success" && berichtTypes.data.fromValueToKey(nieuws)
);

function handleSubmit(e: Event) {
  const { currentTarget } = e;
  if (!(currentTarget instanceof HTMLFormElement)) return;
  e.preventDefault();
  const formData = new FormData(currentTarget);
  const obj = Object.fromEntries(formData);
  state.value.currentSearch = obj?.search?.toString() || "";
  state.value.currentTypeId = parseValidInt(obj?.type?.toString());
}

function handleSearch(e: Event) {
  const { currentTarget } = e;
  if (!(currentTarget instanceof HTMLInputElement)) return;
  e.preventDefault();
  state.value.currentSearch = currentTarget.value;
}
</script>

<style scoped lang="scss">
.home {
  gap: var(--spacing-default);
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-content: flex-start;
  position: relative;

  > * {
    flex-basis: 100%;
  }
}

.home > section {
  &:not(:only-of-type) {
    max-width: var(--section-width);
  }

  > utrecht-heading:first-child {
    padding-left: var(--text-margin);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-tertiary);
  }
}

header {
  flex-flow: row wrap;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#werkberichtTypeInput {
  background-color: var(--color-secondary);
  border-inline-end: var(--border-style);
}

.admin-link {
  padding: var(--spacing-small);
  color: var(--color-headings);
}

.forms {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-default);
  align-items: flex-start;
  justify-content: space-between;
}

label[for="searchInput"] {
  flex: 1;
}

.search-bar {
  width: 100%;
}

.forms > :first-child {
  width: min(100%, var(--section-width));
}

.forms > :last-child {
  width: min(100%, 20rem);
  margin-inline-start: auto;
}

form {
  display: flex;
}

.remove-filter {
  display: flex;
  gap: 0.5rem;
  border: none;

  &:focus-visible {
    outline-color: var(--utrecht-focus-outline-color, transparent);
    outline-offset: var(--utrecht-focus-outline-offset, 0);
    outline-style: var(--utrecht-focus-outline-style, solid);
    outline-width: var(--utrecht-focus-outline-width, 0);
  }

  > :first-child {
    position: absolute;
    left: -999px;
  }
}

.skills-form {
  display: grid;
  gap: 1rem;
  align-items: flex-end;
  justify-items: flex-end;
  width: 100%;
}

menu {
  list-style: none;
}

.delete-skills-menu {
  display: flex;
  flex-flow: row wrap;
  gap: 0.5rem;
}
</style>
