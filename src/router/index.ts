import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import AfhandelingView from "../views/AfhandelingView.vue";
import ContactmomentView from "../views/ContactmomentView.vue";
import { useContactmomentStore } from "@/stores/contactmoment";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/contactmoment/afhandeling",
      name: "afhandeling",
      component: AfhandelingView,
      beforeEnter: (to, from, next) => {
        const contactmoment = useContactmomentStore();
        if (contactmoment.contactmomentLoopt) {
          next();
        } else {
          next("/");
        }
      },
    },
    {
      path: "/contactmoment/contactmoment",
      name: "contactmoment",
      component: ContactmomentView,
    },
  ],
});

export default router;
