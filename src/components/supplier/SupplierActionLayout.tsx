
import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface LayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  loading?: boolean;
  error?: string;
  statusBadge?: ReactNode;
}

export default function SupplierActionLayout({
  children,
  title,
  description,
  loading = false,
  error,
  statusBadge
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-blue-700 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full shadow-xl bg-white">
        <CardHeader className="bg-white border-b">
          <div className="flex items-center justify-between mb-4">
            <Logo size="lg" />
            {statusBadge && (
              <div>
                {statusBadge}
              </div>
            )}
          </div>
          <div>
            <CardTitle className="text-2xl text-gray-900">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-2 text-gray-600">{description}</CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="bg-white">
          {loading ? (
            <div className="w-full flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </div>
  );
}
