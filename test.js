
class GraphVisualization {
  static SVG_NS = 'http://www.w3.org/2000/svg';

  constructor() {
      // Initialize properties
      this.svg = d3.select("svg");
      this.width = +this.svg.attr("width");
      this.height = +this.svg.attr("height");
      this.color = d3.scaleOrdinal(d3.schemeCategory10).domain(["core", "optional", "hidden", "level"]);
      this.el = {};
      document.querySelectorAll('[id]').forEach(e => this.el[e.id] = e);

      // Event listener for SVG download button
      // this.el.downloadsvg.addEventListener('click', () => this.downloadSVG());

      // Graph data initialization
      this.graphData = {
        links: [
          {source: "Web Technologies", target: "Mark L1", type: "level"},
          {source: "Web Technologies", target: "WT L2", type: "level"},
          {source: "Web Technologies", target: "WT L3", type: "level"},
      
          {source: "Mark L1", target: "CARMA", type: "core"},
          {source: "Mark L1", target: "INDAD", type: "core"},
          {source: "Mark L1", target: "INTPROG", type: "core"},
          {source: "Mark L1", target: "NETFUN", type: "core"},
          {source: "Mark L1", target: "WEBF1", type: "core"},
      
          {source: "WT L2", target: "ADPROC", type: "core"},
          {source: "WT L2", target: "GUDE", type: "core"},
          {source: "WT L2", target: "WEPM", type: "core"},
          {source: "WT L2", target: "WEBF2", type: "core"},
          {source: "WT L2", target: "WEBSCPR", type: "core"},
          {source: "WT L2", target: "COSINE", type: "optional"},
          {source: "WT L2", target: "DSALG", type: "optional"},
          {source: "WT L2", target: "DBPRIN", type: "optional"},
      
          {source: "WT L3", target: "ENTWA", type: "core"},
          {source: "WT L3", target: "WEBRES", type: "core"},
          {source: "WT L3", target: "PJE40", type: "core"},
          {source: "WT L3", target: "ADCON12", type: "optional"},
          {source: "WT L3", target: "ADNET", type: "optional"},
          {source: "WT L3", target: "DWM", type: "optional"},
          {source: "WT L3", target: "DISPARP", type: "optional"},
          {source: "WT L3", target: "FLOTA", type: "optional"},
          {source: "WT L3", target: "NETSOC", type: "optional"},
      
          {source: "Software Engineering", target: "Mark L1", type: "level"},
          {source: "Software Engineering", target: "SE L2", type: "level"},
          {source: "Software Engineering", target: "SE L3", type: "level"},
      
          {source: "SE L2", target: "3DCGAA", type:"optional"},
          {source: "SE L2", target: "ADPROC", type:"core"},
          {source: "SE L2", target: "U22732", type:"core"},
          {source: "SE L2", target: "COSINE", type:"optional"},
          {source: "SE L2", target: "DSALG", type:"core"},
          {source: "SE L2", target: "DBPRIN", type:"optional"},
          {source: "SE L2", target: "MATHFUN", type:"core"},
          {source: "SE L2", target: "GUDE", type:"core"},
          {source: "SE L2", target: "INSE", type:"core"},
          {source: "SE L2", target: "WEBSCPR", type:"optional"},
      
          {source: "SE L3", target: "ASE", type:"core"},
          {source: "SE L3", target: "DWM", type:"optional"},
          {source: "SE L3", target: "DISPARP", type:"optional"},
          {source: "SE L3", target: "PJE40", type:"core"},
          {source: "SE L3", target: "FLOTA", type:"optional"},
          {source: "SE L3", target: "NENGA", type:"optional"},
          {source: "SE L3", target: "PARD", type:"optional"},
          {source: "SE L3", target: "RASS", type:"core"},
          {source: "SE L3", target: "WEBRES", type:"optional"},
      
          {source: "Web Technologies", target: "Software Engineering", type: "hidden"}
        ],
          nodes: [],
      };

      // Extract nodes from link data
      this.graphData.nodes = this.extractNodes(this.graphData);

      // Initialize force simulation
      this.simulation = d3.forceSimulation(this.graphData.nodes)
          .force("charge", d3.forceManyBody().strength(-300))
          .force("center", d3.forceCenter(this.width / 2, this.height / 2))
          .force("collide", d3.forceCollide().radius(30).strength(0.8))
          .force("link", d3.forceLink(this.graphData.links).id(d => d.name))
          .force("x", d3.forceX().strength(0.1).x(this.width / 2))
          .force("y", d3.forceY().strength(0.1).y(this.height / 2))
          .on("tick", this.ticked);

      // Initialize SVG elements
      this.links = this.svg.append("svg:g")
          .selectAll("line")
          .data(this.graphData.links)
          .enter()

          .append("svg:line")
          .attr("class", d => "link " + d.type)
          .attr("marker-end", d => "url(#" + d.type + ")");

      this.drag = d3.drag()
          .on("start", this.dragstarted)
          .on("drag", this.dragged)
          .on("end", this.dragended);

      this.textNode = this.svg.append("g")
          .selectAll("g")
          .data(this.graphData.nodes)
          .enter()
          .append("g")
          .call(this.drag);

      this.rectangles = this.textNode
          .append('rect')
          .attr('width', 60)
          .attr('height', 25)
          .attr("fill", d => this.color(d.group));

    //   this.finalNode = this.textNode
    //       .append("circle")
    //       .attr("r", 5)
    //       .attr("fill", "black");

      this.texts = this.textNode
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("x", 30)
          .attr("y", 12.5).selectAll("tspan")
          .data(d => d.name.split(' '))
          .enter()
          .append("tspan")
          .text(d => d)
          .attr("x", 30)
          .attr("dy", (d, i) => i * 8);
  }

  extractNodes(graphData) {
      let nodeSet = new Set();
      graphData.links.forEach(link => {
          nodeSet.add(link.source);
          nodeSet.add(link.target);
      });
      const nodes = Array.from(nodeSet).map(node => {
          return { name: node };
      });
      return nodes;
  }

  ticked = () => {
      // Clip nodes within the SVG container
      this.textNode.attr("transform", d => `translate(${Math.max(0, Math.min(this.width - 50, d.x))},${Math.max(0, Math.min(this.height - 25, d.y))})`);
      this.links
          .attr("x1", d => Math.max(0, Math.min(this.width, d.source.x)+30))
          .attr("y1", d => Math.max(0, Math.min(this.height, d.source.y)+12.5))
          .attr("x2", d => Math.max(0, Math.min(this.width, d.target.x+30)))
          .attr("y2", d => Math.max(0, Math.min(this.height, d.target.y)+12.5))

  }

  dragstarted = (d) => {
      if (!d.active) this.simulation.alphaTarget(0.3).restart();
      d.subject.fx = d.subject.x;
      d.subject.fy = d.subject.y;
  }

  dragged = (d) => {
      d.subject.fx = Math.max(0, Math.min(this.width - 50, d.x));
      d.subject.fy = Math.max(0, Math.min(this.height - 50, d.y));
  }

  dragended = (d) => {
      if (!d.active) this.simulation.alphaTarget(0);
      d.subject.fx = null;
  }

  init() {
      window.addEventListener('resize', this.resize);
      window.addEventListener('dragover', e => e.preventDefault());
      window.addEventListener('drop', e => this.acceptDrop(e));
      this.updateDownloadLink(this.svg.node(), this.graphData)
      this.el.addnode.addEventListener('click', () => this.addNode())
      this.el.deletenode.addEventListener('click', () => this.delNode())
      this.svg.on("dblclick", () => this.addNode());
  }
  

    addNode() {
        const nodeName = prompt("Enter Node Name: ")
        const targetNode = prompt("Enter Target Node: ")
        const linkType = prompt("Enter Link Type: ");
        if (nodeName){
            const newNode = {name: nodeName,target: targetNode, type: linkType , }
            newNode.x = newNode.x || 400;
            newNode.y = newNode.y || 400;
            this.graphData.nodes.push(newNode);
            

            this.graphData.links.push({
                source: this.graphData.nodes.find(node => node.name === nodeName),
                target: this.graphData.nodes.find(node => node.name === targetNode),
                type: linkType
            });

            this.updateSimulation();

            this.redrawGraph(this.graphData);
        }
    }

    delNode() {
        const nodeName = prompt("Enter Node Name: ")
        if(nodeName){
            const index = this.graphData.nodes.findIndex(node => node.name === nodeName);
            if (index > -1) {
                this.graphData.nodes.splice(index, 1);
            }
            this.simulation.nodes(this.graphData.nodes);
            this.simulation.alpha(1.0).restart()

            this.redrawGraph(this.graphData);
        }
        else{
            alert("Invalid Node Name")

        }
    }


    updateSimulation() {
        this.simulation.nodes(this.graphData.nodes);
        this.simulation.force("link").links(this.graphData.links);
        this.simulation.alpha(1.0).restart()
    }


  acceptDrop(e) {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f.type === 'application/json') {
          this.readJSONFile(f);
      } else if (f.type === 'image/svg+xml') {
          this.readSVGFile(f);
      }
  }

  readJSONFile(file) {
      const reader = new FileReader();
      reader.onload = () => {
          try {
              console.log("Mark works")
              const jsonData = JSON.parse(reader.result)
              const graphData = this.gatherInputData(jsonData);
              this.addDataToUI(graphData);
          } catch (error) {
              console.error(error);
              alert("Invalid JSON file");
          }
      };
      reader.readAsText(file);
  }

  readSVGFile(file) {
      const reader = new FileReader();
      reader.onload = () => {
          const parts = reader.result.split('sEpArAt0r');
          this.addDataToUI(JSON.parse(parts[1]));
      };
      reader.readAsText(file);
  }

  gatherInputData(data) {
    const nodesMap = new Map();
    const links = [];

    data.links.forEach(item => {
        const sourceName = item.source;
        const targetName = item.target;

        let sourceNode = nodesMap.get(sourceName);
        if (!sourceNode) {
            sourceNode = { name: sourceName };
            nodesMap.set(sourceName, sourceNode);
        }

        let targetNode = nodesMap.get(targetName);
        if (!targetNode) {
            targetNode = { name: targetName };
            nodesMap.set(targetName, targetNode);
        }

        links.push({
            source: sourceNode,
            target: targetNode,
            type: item.type
        });
    });

    const nodes = Array.from(nodesMap.values());
    return { nodes, links };
}


  addDataToUI(data) {
      console.log("MarkyMoo")
      if (data.nodes && data.links) {
          this.graphData.nodes = data.nodes;
          this.graphData.links = data.links;
          this.redrawGraph(data);
      }
  }

  redrawGraph(data) {
    const graphData = this.gatherInputData(data);
    this.graphData.nodes = graphData.nodes;
    this.graphData.links = graphData.links;

    // Update simulation with new nodes and links
    this.simulation.nodes(this.graphData.nodes);
    this.simulation.force("link").links(this.graphData.links);
    this.simulation.alpha(1).restart();

    // Update existing SVG elements without clearing
    this.updateSVGElements();

    // Update the download link
    this.updateDownloadLink(this.svg.node(), this.graphData);
}

updateSVGElements() {
    // Update links
    this.links = this.links.data(this.graphData.links, d => `${d.source.name}-${d.target.name}`);
    this.links.exit().remove();

    const newLinks = this.links.enter()
        .append("svg:line")
        .attr("class", d => "link " + d.type)
        .attr("marker-end", d => "url(#" + d.type + ")");

    this.links = newLinks.merge(this.links);

    // Update nodes
    this.textNode = this.textNode.data(this.graphData.nodes, d => d.name);
    this.textNode.exit().remove();

    const newNodeGroups = this.textNode.enter()
        .append("g")
        .call(this.drag);

    const newRectangles = newNodeGroups
        .append('rect')
        .attr('width', 60)
        .attr('height', 25)
        .attr("fill", d => this.color(d.group));

    const texode = newNodeGroups
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("x", 30)
        .attr("y", 12.5)
        .text(function (d) {
            if (Array.isArray(d.name)) {
                return d.name.join(' ');
            } else if (typeof d.name === 'object' && d.name.hasOwnProperty('name')) {
                return d.name.name;
            } else {
                return d.name || '';
            }
        });

    this.textNode = newNodeGroups.merge(this.textNode);

    // Update simulation
    this.simulation.nodes(this.graphData.nodes);
    this.simulation.force("link").links(this.graphData.links);
    this.simulation.alpha(1).restart();
}




  downloadSVG = () => {
    // Trigger the download based on the updated link
    this.el.downloadsvg.click();
    this.el.downloadsvg.download = 'graph.svg';
}




  downloadJSON = () => {
      try {
          const jsonData = JSON.stringify(this.graphData, null, 2);
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);

          this.el.downloadjson.href = url;
          this.el.downloadjson.download = 'graphData.json';
      } catch (e) {
          console.error(e);
          this.handleDownloadError();
      }
  }

  updateDownloadLink = (svgElement) => {
      try {
          if (this.css == null) {
              fetch('svg.css')
                  .then(response => response.text())
                  .then(css => {
                      this.css = css;
                      this.finishUpdateDownloadLink(svgElement);
                  })
                  .catch(error => {
                      console.error(error);
                      this.handleDownloadError();
                  });
          } else {
              this.finishUpdateDownloadLink(svgElement);
          }
      } catch (e) {
          console.error(e);
          this.handleDownloadError();
      }
  }

  finishUpdateDownloadLink = (svgElement) => {
    try {
        const links = this.graphData.links;
        const nodes = this.graphData.nodes;

        // Add styling
        const clone = document.importNode(svgElement, true);
        const style = this.svgX('style');
        style.textContent = this.css;
        clone.append(style);

        // Create a new group for nodes and links
        const group = this.svgX('g');

        // Append links to the group
        links.forEach(link => {
            const sourceNode = nodes.find(node => node.name === (link.source && link.source.name));
            const targetNode = nodes.find(node => node.name === (link.target && link.target.name));

            if (sourceNode && targetNode) {
                const line = this.svgX('line', {
                    x1: sourceNode.x,
                    y1: sourceNode.y,
                    x2: targetNode.x,
                    y2: targetNode.y,
                    class: 'link ' + link.type,
                    'marker-end': 'url(#' + link.type + ')',
                    stroke: this.color(link.type)
                });
                group.appendChild(line);
            }
        });

        // Append nodes to the group
        nodes.forEach(node => {
            const nodeElement = this.svgX('g');
            const foundNode = group.appendChild(nodeElement);

            if (foundNode) {
                foundNode.setAttribute('transform', `translate(${node.x},${node.y})`); // Set the node's position
                const rect = this.svgX('rect', { width: 50, height: 25, fill: this.color(node.group) });
                foundNode.append(rect);
            }
        });

        // Append the group to the cloned SVG
        clone.querySelector('g').appendChild(group);

        // Create a Blob and generate a URL
        const serializer = new XMLSerializer();
        const svgContent = serializer.serializeToString(clone);
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        // Update the download link
        this.el.downloadsvg.href = url;
    } catch (e) {
        console.error(e);
        this.handleDownloadError();
    }
}


  


  handleDownloadError = () => {
      delete this.el.downloadsvg.href;
      this.el.downloadsvg.textContent = 'Cannot download SVG';
      this.el.downloadsvg.title = 'Error while generating download link';
  }

  svgX = (name, attributes = {}) => {
      const el = document.createElementNS(GraphVisualization.SVG_NS, name);
      for (const attr of Object.keys(attributes)) {
          el.setAttribute(attr, attributes[attr]);
      }
      return el;
  }
}

const graphViz = new GraphVisualization();
graphViz.init();