import os

def merge_all_content_to_single_txt(source_directory, output_txt_path):
    """
    递归地读取指定目录下所有文件的内容，并将它们合并到一个单独的 txt 文件中，
    在每段内容前标注原始文件路径。

    Args:
        source_directory (str): 要读取文件的源目录路径。
        output_txt_path (str): 合并后的内容将写入的单个 txt 文件路径。
    """
    # 确保输出文件所在的目录存在
    output_dir = os.path.dirname(output_txt_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"创建输出目录: {output_dir}")

    try:
        with open(output_txt_path, 'w', encoding='utf-8') as outfile:
            print(f"开始将内容写入到: {output_txt_path}")

            for root, _, files in os.walk(source_directory):
                for file in files:
                    source_file_path = os.path.join(root, file)

                    # 写入分隔符和原始文件路径
                    outfile.write(f"\n--- Original File: {source_file_path} ---\n")
                    outfile.write("-" * (len(f"--- Original File: {source_file_path} ---")) + "\n") # 添加下划线分隔

                    try:
                        with open(source_file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                            content = infile.read()
                            outfile.write(content)
                        print(f"已处理并追加: {source_file_path}")
                    except Exception as e:
                        error_message = f"[ERROR READING FILE: {e}]"
                        outfile.write(error_message)
                        print(f"处理文件 '{source_file_path}' 时发生错误: {e} (已记录到输出文件)")
            print("\n所有文件内容合并完成！")

    except Exception as e:
        print(f"写入到输出文件 '{output_txt_path}' 时发生错误: {e}")


if __name__ == "__main__":
    # 获取当前脚本所在的目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"脚本所在目录: {script_dir}")

    # --- 用户输入 ---
    source_directory_to_scan = input(f"请输入要扫描并提取内容的目录路径 (留空则为当前目录): ")
    if not source_directory_to_scan:
        source_directory_to_scan = "."
    source_directory_to_scan = os.path.abspath(source_directory_to_scan) # 转换为绝对路径

    # 默认输出文件名，保存在脚本同目录下
    default_output_filename = "merged_content.txt"
    default_output_path = os.path.join(script_dir, default_output_filename)

    user_output_path_choice = input(f"请输入合并后的 txt 文件路径 (留空则使用默认: '{default_output_path}'): ")
    if user_output_path_choice:
        final_output_path = os.path.abspath(user_output_path_choice)
    else:
        final_output_path = default_output_path
        print(f"将使用默认输出文件: '{final_output_path}'")


    # --- 执行合并 ---
    if not os.path.isdir(source_directory_to_scan):
        print(f"错误: 源目录 '{source_directory_to_scan}' 不存在或不是一个有效的目录。")
    else:
        print(f"\n开始从 '{source_directory_to_scan}' 提取并合并文件内容...")
        merge_all_content_to_single_txt(source_directory_to_scan, final_output_path)
        print("合并过程完成！")