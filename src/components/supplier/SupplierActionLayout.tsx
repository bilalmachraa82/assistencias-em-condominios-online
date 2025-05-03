
import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-2">{description}</CardDescription>
              )}
            </div>
            {statusBadge && (
              <div>
                {statusBadge}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="w-full flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
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
