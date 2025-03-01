// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { Injectable } from "@angular/core";
import { IndividualConfig, ToastrService } from "ngx-toastr";

import type { ToastComponent } from "./toast.component";
import { calculateToastTimeout } from "./utils";

export type ToastOptions = {
  /**
   * The duration the toast will persist in milliseconds
   **/
  timeout?: number;
} & Pick<ToastComponent, "message" | "variant" | "title">;

/**
 * Presents toast notifications
 **/
@Injectable({ providedIn: "root" })
export class ToastService {
  constructor(private toastrService: ToastrService) {}

  showToast(options: ToastOptions): void {
    const toastrConfig: Partial<IndividualConfig> = {
      payload: {
        message: options.message,
        variant: options.variant,
        title: options.title,
      },
      timeOut:
        options.timeout != null && options.timeout > 0
          ? options.timeout
          : calculateToastTimeout(options.message),
    };

    this.toastrService.show(null, options.title, toastrConfig);

    requestAnimationFrame(() => {
      const toastElement = document.querySelector("#toast-container") as HTMLElement;
      if (toastElement) {
        toastElement.setAttribute("tabindex", "-1");
        toastElement.focus();
      }
    });
  }

  /**
   * @deprecated use `showToast` instead
   *
   * Converts options object from PlatformUtilsService
   **/
  _showToast(options: {
    type: "error" | "success" | "warning" | "info";
    title: string;
    text: string | string[];
    options?: {
      timeout?: number;
    };
  }) {
    this.showToast({
      message: options.text,
      variant: options.type,
      title: options.title,
      timeout: options.options?.timeout,
    });
  }
}
