// Live Face Recognition & Enrollment API Client
// Targets https://api.kalaburagitech.com using verified multipart/form-data contracts

export interface FaceEnrollRequest {
  imageBuffer: ArrayBuffer | Uint8Array;
  imageContentType?: string;
  fileName?: string;
  empId: string;
  name: string;
  region: string;
  empRank?: string;
}

export interface FaceEnrollResponse {
  success: boolean;
  emp_id?: string;
  person_name?: string;
  face_encoding_id?: number;
  faces_detected?: number;
  processing_time?: number;
  error?: string;
  rawResponse?: any;
}

export interface FaceRecognizeRequest {
  imageBuffer: ArrayBuffer | Uint8Array;
  imageContentType?: string;
  fileName?: string;
  region: string;
}

export interface FaceMatch {
  emp_id: string;
  name: string;
  match_score: number;
  distance: number;
}

export interface FaceRecognizeResponse {
  success: boolean;
  total_faces?: number;
  matches?: FaceMatch[];
  error?: string;
  rawResponse?: any;
}

export class FaceApiClient {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(apiKey: string, baseUrl?: string, timeoutMs: number = 15000) {
    this.apiKey = apiKey.trim();
    this.baseUrl = (baseUrl || process.env.FACE_API_BASE_URL || "https://api.kalaburagitech.com").replace(/\/+$/, "");
    this.timeoutMs = timeoutMs;
  }

  /**
   * Helper to execute fetch with timeout and single retry on 5xx
   */
  private async executeFetch(endpoint: string, options: RequestInit, retried = false): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok && response.status >= 500 && !retried) {
        // Retry once on internal 5xx errors per integration rules
        await new Promise((res) => setTimeout(res, 1000));
        return this.executeFetch(endpoint, options, true);
      }
      return response;
    } catch (err: any) {
      clearTimeout(timeout);
      if (!retried && err.name !== "AbortError") {
        await new Promise((res) => setTimeout(res, 1000));
        return this.executeFetch(endpoint, options, true);
      }
      throw err;
    }
  }

  /**
   * Enrolls a person's face into the upstream biometric vault.
   * Calls POST /api/enroll
   */
  async enrollPerson(params: FaceEnrollRequest): Promise<FaceEnrollResponse> {
    const formData = new FormData();
    const mimeType = params.imageContentType || "image/jpeg";
    const fileName = params.fileName || `enroll_${params.empId}.jpg`;

    const blob = new Blob([params.imageBuffer as any], { type: mimeType });
    formData.append("file", blob, fileName);
    formData.append("emp_id", params.empId);
    formData.append("name", params.name);
    formData.append("region", params.region || "ka");
    if (params.empRank) {
      formData.append("emp_rank", params.empRank);
    }

    try {
      const response = await this.executeFetch("/api/enroll", {
        method: "POST",
        headers: {
          "X-API-Key": this.apiKey,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.detail || data.error || `Upstream HTTP ${response.status}: Failed to enroll face`,
          rawResponse: data,
        };
      }

      return {
        success: data.success ?? true,
        emp_id: data.emp_id,
        person_name: data.person_name,
        face_encoding_id: data.face_encoding_id,
        faces_detected: data.faces_detected,
        processing_time: data.processing_time,
        rawResponse: data,
      };
    } catch (err: any) {
      const isTimeout = err.name === "AbortError";
      return {
        success: false,
        error: isTimeout ? "Face API upstream request timed out after 15s" : err.message || "Face API request failed",
      };
    }
  }

  /**
   * Recognizes faces in an image and returns matching employee IDs.
   * Calls POST /api/recognize
   */
  async recognizeFace(params: FaceRecognizeRequest): Promise<FaceRecognizeResponse> {
    const formData = new FormData();
    const mimeType = params.imageContentType || "image/jpeg";
    const fileName = params.fileName || "recognize_punch.jpg";

    const blob = new Blob([params.imageBuffer as any], { type: mimeType });
    formData.append("file", blob, fileName);
    formData.append("region", params.region || "ka");

    try {
      const response = await this.executeFetch("/api/recognize", {
        method: "POST",
        headers: {
          "X-API-Key": this.apiKey,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.detail || data.error || `Upstream HTTP ${response.status}: Failed to recognize face`,
          rawResponse: data,
        };
      }

      return {
        success: data.success ?? true,
        total_faces: data.total_faces,
        matches: data.matches || [],
        rawResponse: data,
      };
    } catch (err: any) {
      const isTimeout = err.name === "AbortError";
      return {
        success: false,
        error: isTimeout ? "Face API upstream request timed out after 15s" : err.message || "Face API request failed",
      };
    }
  }

  /**
   * Checks health of the upstream Face Recognition API.
   * Calls GET /api/health
   */
  async checkHealth(): Promise<{ ok: boolean; status: number; message: string }> {
    try {
      const response = await this.executeFetch("/api/health", {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey,
        },
      });

      const text = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        message: text,
      };
    } catch (err: any) {
      return {
        ok: false,
        status: 0,
        message: err.message || "Connection refused",
      };
    }
  }
}

/**
 * Utility: converts a base64 data URL or raw base64 string to Uint8Array
 */
export function base64ToUint8Array(base64String: string): { buffer: Uint8Array; mimeType: string } {
  let cleanBase64 = base64String;
  let mimeType = "image/jpeg";

  if (base64String.includes(",")) {
    const parts = base64String.split(",");
    const match = parts[0].match(/:(.*?);/);
    if (match) mimeType = match[1];
    cleanBase64 = parts[1];
  }

  // Node or browser atob support
  const binaryString = typeof atob === "function" 
    ? atob(cleanBase64) 
    : Buffer.from(cleanBase64, "base64").toString("binary");

  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return { buffer: bytes, mimeType };
}
