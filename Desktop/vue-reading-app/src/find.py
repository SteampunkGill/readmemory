import os

def list_files_in_subdirectories(base_directory):
    """
    扫描指定目录下的所有直接子文件夹，并列出这些子文件夹内（仅一层）的所有文件及其完整路径。

    Args:
        base_directory (str): 要扫描的基准目录。

    Returns:
        dict: 一个字典，键是子文件夹的名称，值是该子文件夹内文件信息列表，
              每个文件信息是一个元组 (file_path, file_name)。
    """
    sub_directory_files = {}
    
    # 遍历基准目录下的所有条目
    for entry_name in os.listdir(base_directory):
        full_path = os.path.join(base_directory, entry_name)
        
        # 检查是否是目录（即我们想要进入的子文件夹）
        if os.path.isdir(full_path):
            current_subdir_files = []
            # 遍历这个子文件夹下的所有内容
            for sub_entry_name in os.listdir(full_path):
                sub_full_path = os.path.join(full_path, sub_entry_name)
                # 确保它是一个文件
                if os.path.isfile(sub_full_path):
                    current_subdir_files.append((sub_full_path, sub_entry_name))
            
            # 如果该子文件夹中有文件，则添加到结果字典中
            if current_subdir_files:
                sub_directory_files[entry_name] = current_subdir_files
                
    return sub_directory_files

if __name__ == "__main__":
    # 获取当前脚本所在的目录
    script_directory = os.path.dirname(os.path.abspath(__file__))

    print(f"正在扫描目录 '{script_directory}' 下的直接子文件夹...\n")

    # 调用函数，扫描当前脚本所在目录下的所有直接子文件夹
    all_subdir_info = list_files_in_subdirectories(script_directory)

    if all_subdir_info:
        print("找到以下子文件夹及其文件：")
        for subdir_name, files_list in all_subdir_info.items():
            print(f"\n--- 文件夹: {subdir_name} ---")
            for path, name in files_list:
                print(f"  路径: {path}, 文件名: {name}")
    else:
        print("在脚本同级的目录下未找到任何子文件夹，或者子文件夹中没有文件。")