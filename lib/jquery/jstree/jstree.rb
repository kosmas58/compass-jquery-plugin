class JsTree < ActiveRecord::Base  
  def self.get_children(id)
    result = Array.new
    if id == "1"
      node = find_by_title("ROOT")
    else
      node = find(id)
    end
    children = node.children
    if id != 0
      children.each do |child| 
        result << {
          :attr  => {:id => "node_#{child.id.to_s}", :rel => child.ntype},
          :data  => child.title,
          :state => (child.right - child.left) > 1 ? "closed" : ""
        }
      end
    end    
    return result
  end
  
  def self.search(search_str)    
    result = Array.new
    nodes = find(:all, :conditions => "title LIKE '%#{search_str}%'")  
    if nodes
      nodes.each do |node|
        result << "#node_#{node.id.to_s}"
      end
    end       
    return result
  end
  
  def self.create_node(params)
    if params[:id].to_i > 0
      parent = find(params[:id])
    else
      parent = find_by_title("ROOT")
    end
    node = DemoTree.new()
    node.parent_id = parent.id
    node.position  = params[:position]
    node.left      = parent[:right]
    node.right     = node.left + 1
    node.level     = parent.level + 1
    node.title     = params[:title]
    node.ntype     = params[:type]
    if node.save
      node.ancestors.each do |ancestor|
        ancestor.right += 2
        ancestor.save
      end
      update_all("left = left + 2, right = right + 2", "left >= #{node.right}")
      result = { :status => 1, :id => node.id }   
    else
      result = { :status => 0 }   
    end         
    return result
  end
  
  def self.remove_node(id)
    node = find(id)
    left = node.left
    right = node.right
    dif = right - left + 1
    pid = node.parent_id
    pos = node.position
    
    #  deleting node and its children
    node.delete_branch
    # shift left indexes of nodes right of the node
    update_all("left = left - #{dif}", "left > #{right}")
    # shift right indexes of nodes right of the node and the node's parents
    update_all("right = right - #{dif}", "right > #{left}")  
    # Update position of siblings below the deleted node
    update_all("position = position -1", "parent_id = #{pid} AND position > #{pos}")    
    result = { :status => 1 }         
    return result
  end
  
  def self.rename_node(params)
    node = find(params[:id])
    node.title = params[:title]
    if node.save
      return { :status => 1 }   
    end    
  end
  
  def self.copy_children(id, node)
    node.children.each do |child|
      result = copy_node(id, child)
      copy_children(result[:id], child)
    end
  end

  def self.copy_node(id, node)
    params = {} 
    params[:id]       = id
    params[:position] = node.position 
    params[:title]    = node.title  
    params[:type]     = node.ntype    
    create_node(params) 
  end
  
  def self.move_node(params)
    node_old = find(params[:id])
    result   = copy_node(params[:ref], node_old)
    copy_children(result[:id], node_old)    
    if params[:copy] == "1"   
      result = { :status => 1, :id => result[:id] }
    else
      remove_node(params[:id])
      result = { :status => 1, :id => "1" }
    end
    return result
  end  
end
