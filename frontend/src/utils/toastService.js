import { toast } from "react-toastify";

// Toast configuration
const toastConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
};

// Success notifications
export const showSuccess = (message, options = {}) => {
  toast.success(message, {
    ...toastConfig,
    ...options,
    style: {
      background: "#d4edda",
      color: "#155724",
      border: "1px solid #c3e6cb",
    },
  });
};

// Error notifications
export const showError = (message, options = {}) => {
  toast.error(message, {
    ...toastConfig,
    ...options,
    style: {
      background: "#f8d7da",
      color: "#721c24",
      border: "1px solid #f5c6cb",
    },
  });
};

// Warning notifications
export const showWarning = (message, options = {}) => {
  toast.warn(message, {
    ...toastConfig,
    ...options,
    style: {
      background: "#fff3cd",
      color: "#856404",
      border: "1px solid #ffeaa7",
    },
  });
};

// Info notifications
export const showInfo = (message, options = {}) => {
  toast.info(message, {
    ...toastConfig,
    ...options,
    style: {
      background: "#d1ecf1",
      color: "#0c5460",
      border: "1px solid #bee5eb",
    },
  });
};

// Loading notifications
export const showLoading = (message = "Loading...", options = {}) => {
  return toast.loading(message, {
    ...toastConfig,
    ...options,
    style: {
      background: "#e2e3e5",
      color: "#383d41",
      border: "1px solid #d6d8db",
    },
  });
};

// Update loading toast
export const updateLoading = (toastId, message, type = "success") => {
  toast.update(toastId, {
    render: message,
    type: type,
    isLoading: false,
    autoClose: 5000,
  });
};

// Dismiss loading toast
export const dismissLoading = (toastId) => {
  toast.dismiss(toastId);
};

// Specific notification types
export const showAuthSuccess = (message) => {
  showSuccess(`🔐 ${message}`, {
    autoClose: 3000,
  });
};

export const showAuthError = (message) => {
  showError(`🔐 ${message}`, {
    autoClose: 5000,
  });
};

export const showOrderSuccess = (message) => {
  showSuccess(`📦 ${message}`, {
    autoClose: 4000,
  });
};

export const showOrderError = (message) => {
  showError(`📦 ${message}`, {
    autoClose: 5000,
  });
};

export const showPaymentSuccess = (message) => {
  showSuccess(`💳 ${message}`, {
    autoClose: 4000,
  });
};

export const showPaymentError = (message) => {
  showError(`💳 ${message}`, {
    autoClose: 5000,
  });
};

export const showCartSuccess = (message) => {
  showSuccess(`🛒 ${message}`, {
    autoClose: 3000,
  });
};

export const showCartError = (message) => {
  showError(`🛒 ${message}`, {
    autoClose: 4000,
  });
};

export const showProductSuccess = (message) => {
  showSuccess(`🏺 ${message}`, {
    autoClose: 3000,
  });
};

export const showProductError = (message) => {
  showError(`🏺 ${message}`, {
    autoClose: 4000,
  });
};

export const showChatSuccess = (message) => {
  showSuccess(`💬 ${message}`, {
    autoClose: 3000,
  });
};

export const showChatError = (message) => {
  showError(`💬 ${message}`, {
    autoClose: 4000,
  });
};

export const showNetworkError = () => {
  showError("🌐 Network error. Please check your connection and try again.", {
    autoClose: 6000,
  });
};

export const showServerError = () => {
  showError("🔧 Server error. Please try again later.", {
    autoClose: 6000,
  });
};

export const showValidationError = (message) => {
  showWarning(`⚠️ ${message}`, {
    autoClose: 4000,
  });
};

export const showEmailNotification = (message) => {
  showInfo(`📧 ${message}`, {
    autoClose: 4000,
  });
};

// Promise-based notifications
export const handleAsyncOperation = async (
  operation,
  {
    loadingMessage = "Processing...",
    successMessage = "Operation completed successfully",
    errorMessage = "Operation failed",
    showLoading = true,
  } = {}
) => {
  let toastId = null;
  
  try {
    if (showLoading) {
      toastId = showLoading(loadingMessage);
    }
    
    const result = await operation();
    
    if (toastId) {
      updateLoading(toastId, successMessage, "success");
    } else {
      showSuccess(successMessage);
    }
    
    return result;
  } catch (error) {
    const message = error.response?.data?.message || error.message || errorMessage;
    
    if (toastId) {
      updateLoading(toastId, message, "error");
    } else {
      showError(message);
    }
    
    throw error;
  }
};

// Form validation notifications
export const showFormValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    errors.forEach(error => {
      showValidationError(error);
    });
  } else if (typeof errors === 'object') {
    Object.values(errors).forEach(error => {
      showValidationError(error);
    });
  } else {
    showValidationError(errors);
  }
};

// Clear all toasts
export const clearAllToasts = () => {
  toast.dismiss();
};

// Default export
export default {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoading,
  updateLoading,
  dismissLoading,
  showAuthSuccess,
  showAuthError,
  showOrderSuccess,
  showOrderError,
  showPaymentSuccess,
  showPaymentError,
  showCartSuccess,
  showCartError,
  showProductSuccess,
  showProductError,
  showChatSuccess,
  showChatError,
  showNetworkError,
  showServerError,
  showValidationError,
  showEmailNotification,
  handleAsyncOperation,
  showFormValidationErrors,
  clearAllToasts,
};