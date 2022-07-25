import { defineStore } from "pinia";
import { readonly } from "vue";
import { nanoid } from "nanoid";
type MessageType = "confirm" | "error";

type ToastParams = {
  message: string;
  type?: MessageType;
  timeout?: number;
};

type Message = {
  message: string;
  type: MessageType;
  key: number;
};

const useStore = defineStore("toast", {
  state: () => ({
    messages: [] as Array<Message>,
    key: 0,
  }),
  actions: {
    toast(params: ToastParams) {
      const m = {
        message: params.message,
        type: params.type || "confirm",
        key: (this.key += 1),
      };
      this.messages.push(m);
      setTimeout(() => {
        const index = this.messages.indexOf(m);
        if (index !== -1) {
          this.messages.splice(index, 1);
        }
      }, params.timeout || 3000);
    },
  },
});

export const useToast = () => {
  const store = useStore();
  return {
    messages: readonly(store.messages),
    toast: store.toast,
  };
};
