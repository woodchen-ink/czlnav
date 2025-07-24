"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  Bot,
  X,
  Download,
  GripVertical,
} from "lucide-react";
import Image from "next/image";
import { useAdminApp } from "@/components/AdminAppProvider";

// 网站类型定义
interface Service {
  id: number;
  name: string;
  url: string;
  description: string;
  icon: string | null;
  clickCount: number;
  categoryId: number;
  sortOrder: number;
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
}

// 分类类型定义
interface Category {
  id: number;
  name: string;
}

// 表单值类型
interface ServiceFormValues {
  name: string;
  url: string;
  description: string;
  categoryId: number;
  icon?: string;
}

// 服务表单组件
interface ServiceFormProps {
  open: boolean;
  editingId: number | null;
  initialValues?: Partial<ServiceFormValues>;
  categories: Category[];
  iconFile: File | null;
  onSave: (values: ServiceFormValues) => void;
  onCancel: () => void;
  onIconChange: (file: File | null) => void;
}

// 服务表单组件
const ServiceForm: React.FC<ServiceFormProps> = ({
  open,
  editingId,
  initialValues,
  categories,
  iconFile,
  onSave,
  onCancel,
  onIconChange,
}) => {
  const [fetchLoading, setFetchLoading] = useState(false);
  const [formData, setFormData] = useState<ServiceFormValues>({
    name: "",
    url: "",
    description: "",
    categoryId: 0,
    icon: "",
    ...initialValues,
  });
  const { message } = useAdminApp();

  // 当初始值变化时，重置表单
  useEffect(() => {
    if (open && initialValues) {
      setFormData({
        name: "",
        url: "",
        description: "",
        categoryId: 0,
        icon: "",
        ...initialValues,
      });
    }
  }, [open, initialValues]);

  // 自动获取网站信息
  const handleFetchSiteInfo = async () => {
    if (!formData.url) {
      message.warning("请先输入网站地址");
      return;
    }

    setFetchLoading(true);
    try {
      const response = await fetch("/api/admin/fetch-site-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: formData.url }),
      });

      const data = await response.json();
      if (data.success) {
        const { title, description, icon } = data.data;

        // 只更新空的字段
        const updates: Partial<ServiceFormValues> = {};
        if (title && !formData.name) {
          updates.name = title;
        }
        if (description && !formData.description) {
          updates.description = description;
        }
        if (icon && !formData.icon) {
          updates.icon = icon;
        }

        setFormData(prev => ({ ...prev, ...updates }));
        message.success("网站信息获取成功！");
      } else {
        message.error(data.message || "获取网站信息失败");
      }
    } catch (error) {
      console.error("获取网站信息失败:", error);
      message.error("获取网站信息失败，请稍后重试");
    } finally {
      setFetchLoading(false);
    }
  };

  // 重新获取图标
  const handleRefetchIcon = async () => {
    if (!formData.url) {
      message.warning("请先输入网站地址");
      return;
    }

    setFetchLoading(true);
    try {
      const response = await fetch("/api/admin/fetch-site-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: formData.url }),
      });

      const data = await response.json();
      if (data.success) {
        const { icon } = data.data;
        if (icon) {
          setFormData(prev => ({ ...prev, icon }));
          onIconChange(null); // 清空文件选择
          message.success("图标重新获取成功！");
        } else {
          message.warning("未能获取到网站图标");
        }
      } else {
        message.error(data.message || "获取网站图标失败");
      }
    } catch (error) {
      console.error("获取网站图标失败:", error);
      message.error("获取网站图标失败，请稍后重试");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>{editingId ? "编辑网站" : "添加网站"}</DialogTitle>
        <DialogDescription>
          {editingId ? "修改网站信息和设置" : "添加新的网站到导航目录"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              网站名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => handleInputChange("name", e.target.value)}
              placeholder="请输入网站名称"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">
              网站地址 <span className="text-red-500">*</span>
            </Label>
            <div className="flex">
              <Input
                id="url"
                value={formData.url}
                onChange={e => handleInputChange("url", e.target.value)}
                placeholder="请输入网站地址，以http://或https://开头"
                className="rounded-r-none"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchSiteInfo}
                disabled={fetchLoading}
                className="rounded-l-none border-l-0"
              >
                {fetchLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
                自动获取
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">
              所属分类 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.categoryId.toString()}
              onValueChange={value =>
                handleInputChange("categoryId", parseInt(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择所属分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon">网站图标</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="icon"
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    onIconChange(file);
                  }}
                />
                {(formData.icon || iconFile) && (
                  <div className="w-10 h-10 relative border rounded group">
                    <Image
                      src={
                        iconFile
                          ? URL.createObjectURL(iconFile)
                          : formData.icon!
                      }
                      alt="图标预览"
                      fill
                      className="object-contain rounded"
                      unoptimized
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        onIconChange(null);
                        setFormData(prev => ({ ...prev, icon: "" }));
                        // 清空文件输入框
                        const fileInput = document.getElementById(
                          "icon"
                        ) as HTMLInputElement;
                        if (fileInput) fileInput.value = "";
                      }}
                      title="移除图标"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="或输入图标URL地址"
                  value={formData.icon || ""}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, icon: e.target.value }));
                    onIconChange(null); // 清空文件选择
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    if (!formData.icon) {
                      message.warning("请先输入图标URL");
                      return;
                    }
                    try {
                      const response = await fetch("/api/admin/download-icon", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ iconUrl: formData.icon }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        setFormData(prev => ({
                          ...prev,
                          icon: data.data.localUrl,
                        }));
                        message.success("图标下载成功！");
                      } else {
                        message.error(data.message || "图标下载失败");
                      }
                    } catch (error) {
                      console.error("下载图标失败:", error);
                      message.error("图标下载失败，请稍后重试");
                    }
                  }}
                  title="下载并保存图标"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRefetchIcon}
                  disabled={fetchLoading}
                  title="重新获取网站图标"
                >
                  {fetchLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            网站描述 <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={e => handleInputChange("description", e.target.value)}
            placeholder="请输入网站描述"
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit">保存</Button>
        </DialogFooter>
      </form>
    </div>
  );
};

// 可排序的表格行组件
interface SortableRowProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (id: number) => void;
  onPreview: (icon: string) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({
  service,
  onEdit,
  onDelete,
  onPreview,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "bg-muted/50" : ""}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          {service.id}
        </div>
      </TableCell>
      <TableCell>{service.sortOrder}</TableCell>
      <TableCell>
        {service.icon ? (
          <div
            className="w-10 h-10 relative border rounded cursor-pointer"
            onClick={() => onPreview(service.icon!)}
          >
            <Image
              src={service.icon}
              alt="网站图标"
              fill
              className="object-contain rounded"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-foreground">
            无
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{service.name}</TableCell>
      <TableCell>{service.categoryName}</TableCell>
      <TableCell>{service.clickCount}</TableCell>
      <TableCell>{new Date(service.createdAt).toLocaleString()}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(service.url, "_blank")}
            title="访问"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(service)}
            title="编辑"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(service.id)}
            title="删除"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [formInitialValues, setFormInitialValues] = useState<
    Partial<ServiceFormValues>
  >({});
  const [searchText, setSearchText] = useState<string>("");
  const { message } = useAdminApp();

  // 拖拽传感器设置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽结束事件
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = filteredServices.findIndex(
      service => service.id === active.id
    );
    const overIndex = filteredServices.findIndex(
      service => service.id === over.id
    );

    if (activeIndex !== -1 && overIndex !== -1) {
      const newServices = arrayMove(filteredServices, activeIndex, overIndex);

      // 更新本地状态
      setFilteredServices(newServices);

      // 准备排序更新数据
      const updates = newServices.map((service, index) => ({
        id: service.id,
        sortOrder: index + 1,
      }));

      try {
        // 发送批量更新请求
        const response = await fetch("/api/admin/services/reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ updates }),
        });

        const data = await response.json();
        if (data.success) {
          message.success("排序更新成功");
          // 重新获取服务列表以确保数据同步
          await fetchServices();
        } else {
          message.error(data.message || "排序更新失败");
          // 失败时恢复原始顺序
          await fetchServices();
        }
      } catch (error) {
        console.error("更新排序失败:", error);
        message.error("排序更新失败，请稍后重试");
        // 失败时恢复原始顺序
        await fetchServices();
      }
    }
  };

  // 获取网站列表
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/services");
      const data = await response.json();

      if (data.success) {
        const servicesList = data.data.data.data;

        // 根据当前选中的分类ID筛选服务
        if (selectedCategoryId !== null) {
          setFilteredServices(
            servicesList.filter(
              (service: Service) => service.categoryId === selectedCategoryId
            )
          );
        } else {
          setFilteredServices(servicesList);
        }

        setServices(servicesList);
      } else {
        message.error(data.message || "获取网站列表失败");
      }
    } catch (error) {
      console.error("获取网站列表失败:", error);
      message.error("获取网站列表失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [message, selectedCategoryId]);

  // 获取分类列表
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      } else {
        message.error(data.message || "获取分类列表失败");
      }
    } catch (error) {
      console.error("获取分类列表失败:", error);
      message.error("获取分类列表失败，请稍后重试");
    }
  }, [message]);

  // 初始加载
  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [fetchServices, fetchCategories]);

  // 监听服务数据变化，确保筛选条件正确应用
  useEffect(() => {
    let filtered = services;

    // 应用分类筛选
    if (selectedCategoryId !== null) {
      filtered = filtered.filter(
        service => service.categoryId === selectedCategoryId
      );
    }

    // 应用搜索筛选
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(lowerSearchText)
      );
    }

    setFilteredServices(filtered);
  }, [services, selectedCategoryId, searchText]);

  // 根据分类筛选网站
  const filterServices = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
  };

  // 重置筛选
  const resetFilter = () => {
    setSelectedCategoryId(null);
    setSearchText("");
  };

  // 添加或更新网站
  const handleSave = async (values: ServiceFormValues) => {
    try {
      // 处理图标上传
      let iconPath = values.icon;
      if (iconFile) {
        const formData = new FormData();
        formData.append("file", iconFile);
        formData.append("type", "service"); // 指定上传类型为服务图标

        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          iconPath = uploadData.data.path;
        } else {
          message.error(uploadData.message || "上传图标失败");
          return;
        }
      }

      // 准备请求数据
      const serviceData = {
        ...values,
        icon: iconPath,
      };

      // 发送请求
      const url = editingId
        ? `/api/admin/services/${editingId}`
        : "/api/admin/services";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      const data = await response.json();

      if (data.success) {
        message.success(editingId ? "更新网站成功" : "添加网站成功");
        setModalOpen(false);
        setEditingId(null);
        setIconFile(null);
        setFormInitialValues({});

        // 重新获取服务列表，筛选条件会在fetchServices中应用
        fetchServices();
      } else {
        message.error(
          data.message || (editingId ? "更新网站失败" : "添加网站失败")
        );
      }
    } catch (error) {
      console.error(editingId ? "更新网站失败:" : "添加网站失败:", error);
      message.error(
        editingId ? "更新网站失败，请稍后重试" : "添加网站失败，请稍后重试"
      );
    }
  };

  // 删除网站
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        message.success("删除网站成功");
        fetchServices();
      } else {
        message.error(data.message || "删除网站失败");
      }
    } catch (error) {
      console.error("删除网站失败:", error);
      message.error("删除网站失败，请稍后重试");
    }
  };

  // 编辑网站
  const handleEdit = async (record: Service) => {
    setEditingId(record.id);

    // 设置表单初始值
    setFormInitialValues({
      name: record.name,
      url: record.url,
      description: record.description,
      categoryId: record.categoryId,
      icon: record.icon || undefined,
    });

    // 清除上传的文件
    setIconFile(null);

    setModalOpen(true);
  };

  // 添加网站
  const handleAdd = () => {
    setEditingId(null);
    setIconFile(null);
    setFormInitialValues({});
    setModalOpen(true);
  };

  // 处理图标上传
  const handleIconChange = (file: File | null) => {
    setIconFile(file);
  };

  // 确认删除函数
  const confirmDelete = (id: number) => {
    if (window.confirm("确定要删除这个网站吗？")) {
      handleDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">网站管理</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchServices()}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            刷新
          </Button>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            添加网站
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategoryId === null ? "default" : "outline"}
              onClick={resetFilter}
              size="sm"
            >
              全部
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={
                  selectedCategoryId === category.id ? "default" : "outline"
                }
                onClick={() => filterServices(category.id)}
                size="sm"
              >
                {category.name}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <Input
              placeholder="搜索网站名称"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead className="w-16">排序</TableHead>
                <TableHead className="w-16">图标</TableHead>
                <TableHead>名称</TableHead>
                <TableHead className="w-32">分类</TableHead>
                <TableHead className="w-24">点击量</TableHead>
                <TableHead className="w-44">创建时间</TableHead>
                <TableHead className="w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={filteredServices.map(service => service.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredServices.map(service => (
                  <SortableRow
                    key={service.id}
                    service={service}
                    onEdit={handleEdit}
                    onDelete={confirmDelete}
                    onPreview={setPreviewImage}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          {modalOpen && (
            <ServiceForm
              open={modalOpen}
              editingId={editingId}
              initialValues={formInitialValues}
              categories={categories}
              iconFile={iconFile}
              onSave={handleSave}
              onCancel={() => setModalOpen(false)}
              onIconChange={handleIconChange}
            />
          )}
        </DialogContent>
      </Dialog>

      {previewImage && (
        <Dialog
          open={!!previewImage}
          onOpenChange={() => setPreviewImage(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>图标预览</DialogTitle>
              <DialogDescription>网站图标预览</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-6">
              <Image
                src={previewImage}
                alt="图标预览"
                width={300}
                height={300}
                className="object-contain rounded-lg"
                unoptimized
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
