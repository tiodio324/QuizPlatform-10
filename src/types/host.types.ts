export interface Host {
  id: string;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  isBuiltIn?: boolean;
  createdAt: string;
}

export interface HostFormData {
  name: string;
  email: string;
  password: string;
}
