import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, File, Image, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (file: File, preview: string | null) => void;
  onClear: () => void;
  selectedFile: File | null;
  preview: string | null;
}

export function FileUpload({ onFileSelect, onClear, selectedFile, preview }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileSelect(file, e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      onFileSelect(file, null);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        onChange={handleFileSelect}
      />
      
      {selectedFile ? (
        <div className="border border-border rounded-lg p-3 bg-background">
          {preview ? (
            // Image preview
            <div className="space-y-2">
              <div className="relative">
                <img 
                  src={preview} 
                  alt={selectedFile.name}
                  className="max-w-full h-32 object-cover rounded"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                >
                  <X className="h-3 w-3 text-white" />
                </Button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Image className="h-4 w-4" />
                <span className="truncate">{selectedFile.name}</span>
                <span>({formatFileSize(selectedFile.size)})</span>
              </div>
            </div>
          ) : (
            // File preview
            <div className="flex items-center space-x-2">
              {getFileIcon(selectedFile.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClear}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 w-8 p-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface FileMessageProps {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}

export function FileMessage({ fileName, fileUrl, fileType, fileSize }: FileMessageProps) {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (fileType.startsWith('image/')) {
    return (
      <div className="space-y-2">
        <img 
          src={fileUrl} 
          alt={fileName}
          className="max-w-xs rounded cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(fileUrl, '_blank')}
        />
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Image className="h-3 w-3" />
          <span>{fileName}</span>
          {fileSize && <span>({formatFileSize(fileSize)})</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 p-3 border border-border rounded-lg bg-muted/30 max-w-xs">
      {getFileIcon(fileType)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        {fileSize && (
          <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={handleDownload}>
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}