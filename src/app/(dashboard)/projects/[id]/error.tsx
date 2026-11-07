'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export default function ProjectErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error('Project page error caught by boundary:', error);
  }, [error]);

  return (
    <div
      role="alert"
      className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center"
      data-testid="project-error-boundary"
    >
      <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mb-4">
        <Icon name="alert" size={32} />
      </div>
      <h2 className="text-xl font-bold text-text mb-2">
        حدث خطأ أثناء تحميل المشروع أو المكالمة
      </h2>
      <p className="text-sm text-text-2 max-w-md mb-6">
        تم استعادة حالة الأمان لمنع توقف التطبيق. يمكنك إعادة المحاولة فوراً أو العودة للوحة التحكم.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={() => reset()}>
          إعادة المحاولة
        </Button>
        <Link href="/dashboard">
          <Button variant="secondary">
            العودة للوحة التحكم
          </Button>
        </Link>
      </div>
    </div>
  );
}
