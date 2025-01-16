// Frontend (React + TypeScript)
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as d3 from "d3";

// Ontology Model Definition
export interface BaseWork {
  id: number;
  title: string;
  creatorIds: number[]; // References to Person IDs
  type: "Film" | "Book" | "Painting";
  genre: string;
  theme: string;
  period: string;
  relatedWorks: number[]; // References to related work IDs
}

// différents type d'oeuvre avec différentes propriétés
export interface Film extends BaseWork {
  type: "Film";
  duration: number;
  studio: string;
  actors: number[];
}

export interface Book extends BaseWork {
  type: "Book";
  narrativeType: string;
  pageCount: number;
}

export interface Painting extends BaseWork {
  type: "Painting";
  medium: string;
  dimensions: { width: number; height: number };
  location: string;
}

// Personne
export interface Person {
  id: number;
  name: string;
  birthYear?: number;
  deathYear?: number;
  roles: ("Author" | "Actor" | "Director" | "Painter")[];
  works: number[];
}

interface IData {
  persons: Person[];
  works: Work[];
}

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export type Work = Film | Book | Painting;

const App: React.FC = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [data, setData] = useState<IData | null>(null);

  const [category, setCategory] = useState<"Work" | "Person">("Work");
  const [search, setSearch] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [role, setRole] = useState<string>("");

  const svgRef = useRef<SVGSVGElement | null>(null);

  const screenWidth = getWindowDimensions().width;
  const screenHeight = getWindowDimensions().height;

  const handleNodeClick = (node: any) => {
    setSelectedNode(node); // Mettre à jour le nœud sélectionné
  };

  useEffect(() => {
    axios
      .get(`http://localhost:3001/search`, {
        params: {
          category: category,
          type: type,
          search: search,
          role: role,
        },
      })
      .then((response) => {
        setData(response.data);
      });
  }, [category, search, type, role]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = (2 * screenWidth) / 3;
    const height = screenHeight;

    svg.selectAll("*").remove();
    const g = svg.append("g");

    const links: any[] = [];
    const nodes: any[] = [];

    for (const person of data?.persons ?? []) {
      for (const work of data?.works ?? []) {
        if (work.creatorIds.includes(person.id)) {
          links.push({
            source: "person" + person.id,
            target: "work" + work.id,
            label: person.roles.includes("Director") ? "Directeur" : "Auteur",
          });
        } else if (
          work.type === "Film" &&
          (work as Film).actors.includes(person.id)
        ) {
          links.push({
            source: "person" + person.id,
            target: "work" + work.id,
            label: "Acteur",
          });
        }
      }
    }

    for (const work of data?.works ?? []) {
      for (const relatedWorkId of work.relatedWorks) {
        links.push({
          source: "work" + work.id,
          target: "work" + relatedWorkId,
          label: work.type === "Film" ? "Adaptation" : "Thème/Inspiration",
        });
      }
    }

    for (const person of data?.persons ?? []) {
      nodes.push({
        id: "person" + person.id,
        label: person.name,
        type: "Person",
        birthYear: person.birthYear,
        deathYear: person.deathYear,
        roles: person.roles,
        works: person.works,
      });
    }

    for (const work of data?.works ?? []) {
      nodes.push({
        id: "work" + work.id,
        label: work.title,
        type: work.type,
        genre: work.genre,
        theme: work.theme,
        period: work.period,
        creatorIds: work.creatorIds,
        ...(work.type === "Film" && {
          duration: (work as Film).duration,
          studio: (work as Film).studio,
          actors: (work as Film).actors,
        }),
        ...(work.type === "Book" && {
          narrativeType: (work as Book).narrativeType,
          pageCount: (work as Book).pageCount,
        }),
        ...(work.type === "Painting" && {
          medium: (work as Painting).medium,
          dimensions: (work as Painting).dimensions,
          location: (work as Painting).location,
        }),
      });
    }

    const zoom = d3
      .zoom()
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    g.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 2);

    g.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 10)
      .attr("fill", (d) => {
        if (d.type === "Film") return "red";
        if (d.type === "Book") return "orange";
        if (d.type === "Painting") return "green";
        return "blue";
      })
      .on("click", (_, d) => handleNodeClick(d));

    g.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d: any) => d.label)
      .attr("x", 15)
      .attr("y", 5)
      .attr("pointer-events", "none") // Rend le texte non cliquable
      .style("user-select", "none"); // Empêche la sélection du texte

    // Ajouter des labels sur les liens
    const linkLabels = g
      .append("g")
      .selectAll(".link-label")
      .data(links)
      .enter()
      .append("text")
      .attr("class", "link-label")
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .style("font-size", "12px")
      .text((d: any) => d.label);

    simulation.on("tick", () => {
      g.selectAll("line")
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      g.selectAll("circle")
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      g.selectAll("text")
        .attr("x", (d: any) => d.x + 15)
        .attr("y", (d: any) => d.y + 5);

      linkLabels
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);
    });
  }, [data]);

  return (
    <div className="bg-white w-full h-full min-h-screen flex">
      {/* Section gauche : Graphe */}
      <div className="w-2/3 h-full flex justify-center items-center bg-gray-100 container">
        <svg ref={svgRef} width="100%" height="100%" />
      </div>

      {/* Section droite : Détails */}
      <div className="w-1/3 h-full p-4 bg-white border-l">
        <h1 className="text-2xl font-bold mb-4">
          Ontologie des oeuvres culturelles
        </h1>
        <div className="flex flex-col gap-8 ">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une œuvre ou une personne..."
              className="w-full mb-4 p-2 border border-gray-300 rounded"
            />
            <div className="flex flex-row gap-2">
              <label>Rechercher par catégorie :</label>
              <div className="flex flex-row gap-8">
                <div className="flex flex-row gap-2 items-center">
                  <input
                    type="radio"
                    value={"Work"}
                    checked={category === "Work"}
                    onChange={() => setCategory("Work")}
                  />
                  <label>Œuvre</label>
                </div>
                <div className="flex flex-row gap-2 items-center">
                  <input
                    type="radio"
                    value={"Person"}
                    checked={category === "Person"}
                    onChange={() => setCategory("Person")}
                  />
                  <label>Personne</label>
                </div>
              </div>
            </div>
            {category === "Work" && (
              <div className="flex flex-row gap-2">
                <label>Rechercher par type :</label>
                <div className="flex flex-row gap-8">
                  <div className="flex flex-row gap-2 items-center">
                    <input
                      type="radio"
                      value={"Painting"}
                      checked={type === "Painting"}
                      onChange={() => setType("Painting")}
                    />
                    <label>Peinture</label>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <input
                      type="radio"
                      value={"Film"}
                      checked={type === "Film"}
                      onChange={() => setType("Film")}
                    />
                    <label>Film</label>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <input
                      type="radio"
                      value={"Book"}
                      checked={type === "Book"}
                      onChange={() => setType("Book")}
                    />
                    <label>Livre</label>
                  </div>
                </div>
              </div>
            )}
            {category === "Person" && (
              <div className="flex flex-row gap-2">
                <label>Rechercher par rôle :</label>
                <div className="flex flex-row gap-8">
                  <div className="flex flex-row gap-2 items-center">
                    <input
                      type="radio"
                      value={"Author"}
                      checked={role === "Author"}
                      onChange={() => setRole("Author")}
                    />
                    <label>Auteur</label>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <input
                      type="radio"
                      value={"Actor"}
                      checked={role === "Actor"}
                      onChange={() => setRole("Actor")}
                    />
                    <label>Acteur</label>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <input
                      type="radio"
                      value={"Director"}
                      checked={role === "Director"}
                      onChange={() => setRole("Director")}
                    />
                    <label>Directeur</label>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <input
                      type="radio"
                      value={"Painter"}
                      checked={role === "Painter"}
                      onChange={() => setRole("Painter")}
                    />
                    <label>Peintre</label>
                  </div>
                </div>
              </div>
            )}
          </div>
          {selectedNode ? (
            <div>
              <h2 className="text-xl font-bold mb-4">{selectedNode.label}</h2>
              <p>
                <strong>Type:</strong> {selectedNode.type}
              </p>
              {selectedNode.type === "Person" && (
                <>
                  {selectedNode.birthYear && (
                    <p>
                      <strong>Année de naissance :</strong>{" "}
                      {selectedNode.birthYear ?? "N/A"}
                    </p>
                  )}
                  {selectedNode.deathYear && (
                    <p>
                      <strong>Année de décès :</strong>{" "}
                      {selectedNode.deathYear ?? "N/A"}
                    </p>
                  )}
                  <p>
                    <strong>Rôles :</strong> {selectedNode.roles?.join(", ")}
                  </p>
                </>
              )}
              {(selectedNode.type === "Film" ||
                selectedNode.type === "Book" ||
                selectedNode.type === "Painting") && (
                <>
                  <p>
                    <strong>Genre :</strong> {selectedNode.genre}
                  </p>
                  <p>
                    <strong>Thème :</strong> {selectedNode.theme}
                  </p>
                  <p>
                    <strong>Année :</strong> {selectedNode.period}
                  </p>
                  {selectedNode.type === "Film" && (
                    <>
                      <p>
                        <strong>Durée :</strong> {selectedNode.duration} minutes
                      </p>
                      <p>
                        <strong>Studio :</strong> {selectedNode.studio}
                      </p>
                    </>
                  )}
                  {selectedNode.type === "Book" && (
                    <>
                      <p>
                        <strong>Type narratif :</strong>{" "}
                        {selectedNode.narrativeType}
                      </p>
                      <p>
                        <strong>Nombre de pages :</strong>{" "}
                        {selectedNode.pageCount}
                      </p>
                    </>
                  )}
                  {selectedNode.type === "Painting" && (
                    <>
                      <p>
                        <strong>Médium :</strong> {selectedNode.medium}
                      </p>
                      <p>
                        <strong>Dimensions :</strong>{" "}
                        {selectedNode.dimensions.width}x
                        {selectedNode.dimensions.height} cm
                      </p>
                      <p>
                        <strong>Localisation :</strong> {selectedNode.location}
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-500">
              Cliquez sur un élément du graphe pour afficher les détails ici.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
