/**
 * 官网展示内容仅允许英文的公共校验规则。
 * 这些字段值会原样显示在官网（英文站无翻译层），若混入中文，官网会直接
 * 显示中文内容，故在控制台源头拦截。value 可能是数组（tags 模式）。
 */
export const noChineseRule = (label: string) => ({
  validator: (_: unknown, value: string | string[] | undefined) => {
    if (!value) return Promise.resolve();
    const values = Array.isArray(value) ? value : [value];
    // 匹配 CJK 汉字：基本区 U+4E00-U+9FFF、扩展A区 U+3400-U+4DBF、兼容区 U+F900-U+FAFF
    const hasHan = values.some((v) =>
      Array.from(v).some((ch) => {
        const code = ch.codePointAt(0) ?? 0;
        return (
          (code >= 0x3400 && code <= 0x4dbf) ||
          (code >= 0x4e00 && code <= 0x9fff) ||
          (code >= 0xf900 && code <= 0xfaff)
        );
      }),
    );
    return hasHan
      ? Promise.reject(new Error(`${label}仅支持英文，请勿输入中文`))
      : Promise.resolve();
  },
});
