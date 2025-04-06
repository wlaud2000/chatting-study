// src/api/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../utils/constants';

/**
 * API 요청을 처리하는 싱글턴 클래스
 * 모든 API 요청에 자동으로 인증 토큰을 포함시키고 중앙에서 에러 처리를 관리합니다.
 */
export default class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터 설정 - 모든 요청에 인증 토큰 추가
    this.client.interceptors.request.use(
      (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken && config.headers) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터 설정 - 에러 처리 가능
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // 401 에러 처리 등 필요 시 추가 가능
        console.error('API 요청 실패:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 싱글턴 인스턴스 반환
   */
  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * GET 요청
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * POST 요청
   */
  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT 요청
   */
  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE 요청
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}