
package genomic;
import javax.sql.rowset.serial.SerialRef;

import contighandlerNew.MultiContigHandler;
import main.Config;

import java.io.*;
import java.nio.file.*;
import java.nio.file.*;
import java.util.*;


public class GFFio {

    //	public static PrintStream out = Config.getPrintStream();
    public static List<Gene> parseGFFOld(String filename) throws Exception {
        List<Gene> res = new LinkedList<Gene>();

        try {

            Map<String, String> locusTag2DescMap = new HashMap<String, String>();

            BufferedReader r = new BufferedReader(new FileReader(filename));
            String line;

            String id;
            String type;
            int start;
            int end;
            char strand;
            String desc;
            String source;

            Map<String, String> attributes = new HashMap<String, String>();
            String[] cells;
            String[] attcells;

            for (line = r.readLine(); line != null; line = r.readLine()) {
                line = line.trim();
                if (line.length() == 0)
                    continue;
                if (line.charAt(0) == '#')
                    continue;

                cells = line.split("[\\t]");

                //if(!(cells[2].equalsIgnoreCase("CDS") || cells[2].equalsIgnoreCase("exon")))
                //continue;

                //source = 0
                source = cells[0];

                //type = 2
                type = cells[2];

                // start = 3
                start = Integer.parseInt(cells[3]);

                // end = 4
                end = Integer.parseInt(cells[4]);

                // strand = 6
                strand = cells[6].charAt(0);

                attributes.clear();

                if (cells.length >= 9)
                    for (String s : cells[8].split(";")) {
                        attcells = s.split("=");
                        if (attcells.length == 2)
                            attributes.put(attcells[0].trim(), attcells[1].trim());
                        else if (attcells.length == 1)
                            attributes.put(attcells[0].trim(), "");
                    }

                if (attributes.containsKey("locus_tag"))
                    id = attributes.get("locus_tag");
                else if (attributes.containsKey("ID"))
                    id = attributes.get("ID");
                    //try gene_id from gtf files
                else if (attributes.containsKey("gene_id"))
                    id = attributes.get("gene_id");
                else
                    id = "locus" + start + "-" + end;

                if (attributes.containsKey("product"))
                    desc = attributes.get("product");
                else
                    desc = "";

                if (attributes.containsKey("locus_tag")) {
                    if (attributes.containsKey("product"))
                        locusTag2DescMap.put(attributes.get("locus_tag"), attributes.get("product"));

                    if (attributes.containsKey("pseudo"))
                        locusTag2DescMap.put(attributes.get("locus_tag"), "pseudo");
                }

                if (type.equalsIgnoreCase("gene"))
                    res.add(new Gene(source, source, id, type, start, end, strand, desc));
            }
            r.close();

            //set descriptions
            for (Gene g : res)
                if (locusTag2DescMap.containsKey(g.getId()))
                    g.setDescription(locusTag2DescMap.get(g.getId()));

        } catch (Throwable e) {
            throw new Exception("A problem occured while parsing the GFF annotation:\n" + filename + "\n" + e.toString(), e);
        }

        return res;
    }


    /**
     * A wrapper method for parseGFF, will read multiple GFFs and refactor the
     * gene positions automatically according to their corresponding offset
     * in the super-contig.
     *
     * @param filename  One of the GFF files in the directory with all GFFs for this multi contig
     * @param mcHandler The matching multi-contig handler of the current genome
     * @return A refactored list of all position-adjusted genes
     * @throws Exception Well, if something goes wrong
     */
    public static List<Gene> parseMultiGFF(String filename, MultiContigHandler mcHandler, String classID, PrintStream out) throws Exception {

        List<Gene> totalGeneSet = new LinkedList<>();

        // We may find annotations, where we have no contig file
        HashSet<String> contigGFFWithoutContigInput = new HashSet<>();

        if (filename == null || filename.trim().length() == 0)
            return totalGeneSet;

        /* Get a list with all the GFF files in the same directory */
        File file = new File(filename);
        String fileName = file.getName();
        ;
        List<String> allGFFs = scanDir(filename);
        //System.out.println("scannedDir:  "+ allGFFs);

        /* Parse all genes from the GFF files*/
        allGFFs.forEach(gffFile -> {
            List<Gene> currentGeneSet = new ArrayList<>();
            try {
                currentGeneSet = parseGFF(gffFile, classID, out);
            } catch (Exception e) {
                System.err.println("Could not parse GFF file: " + gffFile);
            } finally {
                totalGeneSet.addAll(currentGeneSet);
            }
        });


        /* Retrieve the contig offset map */
        Map<String, Integer> contigOffsetMap = mcHandler.calcContigOffset();
        //System.out.println("contigOffset: " + contigOffsetMap);
        Set<String> test = contigOffsetMap.keySet();

		/* Refactor the gene start and end position
		by the offset in the super-contig */


        totalGeneSet.forEach((Gene gene) -> {
            if (contigOffsetMap.get(gene.getOrigin()) == null) {
				/*It may happen, that the ref seq is different
				  in the gff file than in the FASTA:
				  	  i.e.  AJZ000001.1 <-> NZ_AJZ000001.1
				  We have to capture that. */
                String shortendRefSeqID = gene.getOrigin();
                if (contigOffsetMap.get(gene.getOrigin()) != null) {
                    gene.changeOrigin(shortendRefSeqID);
                    int offset = contigOffsetMap.get(gene.getOrigin());
                    //System.out.println("offset1: " + offset);
                    gene.adjustStartPos(offset);
                    gene.adjustEndPos(offset);
                } else {
                    contigGFFWithoutContigInput.add(gene.getOrigin());
                    System.out.println(String.format("Could not find gene's contig ID %s " +
                            "in contig list.", gene.getOrigin()));
                }
            } else {
                int offset = contigOffsetMap.get(gene.getOrigin());
                gene.adjustStartPos(offset);
                gene.adjustEndPos(offset);
            }
            //System.out.println("geneOrigin " + gene.getOrigin());
        });

        for (Iterator<Gene> geneIterator = totalGeneSet.iterator(); geneIterator.hasNext(); ) {
            if (contigGFFWithoutContigInput.contains(geneIterator.next().getOrigin())) {
                geneIterator.remove();
            }
        }

        return totalGeneSet;
    }


    /**
     * Scans the parent directory of the given GFF file for all
     * GFF files and adds them to a list.
     *
     * @param filename The current GFF file
     * @return A list of all GFF files in the same directory
     * @throws IOException If something goes wrong
     */
    public static List<String> scanDir(String filename) throws IOException {
        ArrayList<String> dirContent = new ArrayList<>();
        Path file = Paths.get(filename);
        DirectoryStream<Path> directoryStream = Files.newDirectoryStream(file.getParent());

        directoryStream.forEach((Path x) -> {
            if (x.toString().toLowerCase().endsWith("gff") || x.toString().toLowerCase().endsWith("gtf"))
                dirContent.add(x.toString());
        });

        return dirContent;
    }


    /**
     * Saves identifier in the header line of the annotation files
     * and stores them all in a List
     *
     * @param filename the current GFF file
     * @return a list containing all identifiers of the annotation files
     * @throws Exception
     */
    public static List<String> extractAnnotationIdentifier(String filename) throws Exception {
        List<String> allGffs = scanDir(filename);
        List<String> gffIdentifier = new LinkedList<String>();

        for (String gffFile : allGffs) {
            try {
                @SuppressWarnings("resource")
                BufferedReader r = new BufferedReader(new FileReader(gffFile));
                String line;
                String identifier;
                while ((line = r.readLine()).contains("#")) {
                    if (line.contains("##sequence-region")) {
                        identifier = line.split(" ")[1];
                        gffIdentifier.add(identifier);
                    } else if (line.contains("##Type DNA")) {
                        identifier = line.split(" ")[2];
                        gffIdentifier.add(identifier);
                    }

                }
            } catch (Exception e) {
                throw new Exception(String.format("Could not read file %s", gffFile));

            }
        }
        return gffIdentifier;
    }


    /**
     * Extracts the file extension of a give annotation file
     *
     * @param file
     * @return String with the extension gff or gtf
     */

    //taken from http://www.technicalkeeda.com/java-tutorials/get-file-extension-using-java, 27th march 2019
    private static String getFileExtension(File file) {
        String extension = "";

        try {
            if (file != null && file.exists()) {
                String name = file.getName();
                extension = name.substring(name.lastIndexOf(".") + 1);
            }
        } catch (Exception e) {
            extension = "";
        }

        return extension;
    }


    public static List<Gene> parseGFF(String filename, String outputID, PrintStream out) throws Exception {
        List<Gene> res = new LinkedList<Gene>();

        //return empty list if no file given
        if (filename == null || filename.trim().length() == 0) {
            //System.out.println("No annotation file is used! All TSS will be classified as orphan!");
            return res;
        }
        try {

            Map<String, String> locusTag2DescMap = new HashMap<String, String>();
            Map<String, String> parentId2DescMap = new HashMap<String, String>();
            Map<String, String> position2DescMap = new HashMap<String, String>();

            BufferedReader r = new BufferedReader(new FileReader(filename));
            String extension = getFileExtension(new File(filename));

            //System.out.println("extension " + extension);
            //System.out.println("file " + filename);

            //String extension1 = (new File(filename))
            //System.out.println("extension1 " + extension1); //[1] + "la: " + extension1[1]);

            String line;

            String id;
            String type;
            int start;
            int end;
            char strand;
            String desc;
            String source;
            String idAsParent;

            Map<String, String> attributes = new HashMap<String, String>();
            String[] cells;
            String[] attcells;
            boolean foundID = false;

            for (line = r.readLine(); line != null; line = r.readLine()) {
                line = line.trim();
                if (line.length() == 0)
                    continue;
                if (line.charAt(0) == '#')
                    continue;

                cells = line.split("[\\t]");

                //if(!(cells[2].equalsIgnoreCase("CDS") || cells[2].equalsIgnoreCase("exon")))
                //continue;

                //source = 0
                source = cells[0];

                //type = 2
                type = cells[2];

                // start = 3
                start = Integer.parseInt(cells[3]);

                // end = 4
                end = Integer.parseInt(cells[4]);

                // strand = 6
                strand = cells[6].charAt(0);


                attributes.clear();

                if (extension.equalsIgnoreCase("gff") || extension.equalsIgnoreCase("gff3")) {

                    if (cells.length >= 9)
                        for (String s : cells[8].split(";")) {
                            attcells = s.split("=");
                            if (attcells.length == 2)
                                attributes.put(attcells[0].trim(), attcells[1].trim());
                            else if (attcells.length == 1)
                                attributes.put(attcells[0].trim(), "");
                        }
                } else if (extension.equalsIgnoreCase("gtf")) {

                    //for gtf files
                    if (cells.length >= 9)
                        for (String s : cells[8].split("; ")) {
                            attcells = s.split(" ");
                            //System.out.println("string: " + s);
                            //System.out.println("string length: " + s.length());
                            if (attcells.length == 2) {
                                attributes.put(attcells[0].trim(), attcells[1].trim());
                                //System.out.println("attcells[0]: " + attcells[0]);
                                //System.out.println("attcells[0].trim" + attcells[0].trim());
                            } else if (attcells.length == 1)
                                attributes.put(attcells[0].trim(), "");
                        }
                }


                //System.out.println("attributes: " + attributes.toString());

                if (attributes.containsKey(outputID)) {
                    id = attributes.get(outputID);
                    //else if(attributes.containsKey("ID"))
                    //id=attributes.get("ID");
                    //try gene_id from gtf files
                    //else if(attributes.containsKey("gene_id"))
                    //id=attributes.get("gene_id");
                    foundID = true;
                } else
                    id = "locus" + start + "-" + end;


                //gff
                if (attributes.containsKey("ID"))
                    idAsParent = attributes.get("ID");
                    //else if (attributes.containsKey("locus_tag"))
                    //	idAsParent = attributes.get("locus_tag");

                    //gtf
                else if (attributes.containsKey("gene_id"))
                    idAsParent = attributes.get("gene_id");
                else
                    idAsParent = null;

                //gff
                if (attributes.containsKey("product"))
                    desc = attributes.get("product");
                else if (attributes.containsKey("note"))
                    desc = attributes.get("note");
                    //for the gtf case
                else if (attributes.containsKey("gene_biotype"))
                    desc = attributes.get("gene_biotype");
                else
                    desc = "";

                //System.out.println("desc: " + desc);


                //locus tag to desc mapping
                if (attributes.containsKey(outputID)) {
                    if (attributes.containsKey("product"))
                        locusTag2DescMap.put(attributes.get(outputID), attributes.get("product"));

                    if (attributes.containsKey("pseudo"))
                        locusTag2DescMap.put(attributes.get(outputID), "pseudo");

                    if (attributes.containsKey("gene_biotype")) {
                        if (attributes.containsKey("gene_name"))
                            locusTag2DescMap.put(attributes.get(outputID), attributes.get("gene_biotype") + " " + attributes.get("gene_name"));
                        else
                            locusTag2DescMap.put(attributes.get(outputID), attributes.get("gene_biotype"));
                    }
                }

                //gene_id to desc mapping
			/*if(attributes.containsKey("gene_id"))
			{
				if(attributes.containsKey("gene_biotype"))
					locusTag2DescMap.put(attributes.get("gene_id"), attributes.get("gene_biotype"));
					
				if(attributes.containsKey("pseudo"))
					locusTag2DescMap.put(attributes.get("gene_id"), "pseudo");
			}*/


                //parent id to desc mapping
                //for the gff case
                if (attributes.containsKey("Parent")) {
                    if (attributes.containsKey("product"))
                        parentId2DescMap.put(attributes.get("Parent"), attributes.get("product"));

                    if (attributes.containsKey("pseudo"))
                        parentId2DescMap.put(attributes.get("Parent"), "pseudo");
                }
                //else if (attributes.containsKey("locus_tag"))
                //	parentId2DescMap.put(attributes.get("locus_tag"), attributes.get("product"));

                //for the gtf case use gene_id as parent
                if (attributes.containsKey("gene_id")) {
                    if (attributes.containsKey("gene_biotype"))
                        parentId2DescMap.put(attributes.get("gene_id"), attributes.get("gene_biotype"));
                }


                //position to desc map
                //if(attributes.containsKey("locus_tag"))
                //	position2DescMap.put(start+"_"+end+"_"+strand, attributes.get("product"));
                if (attributes.containsKey("product"))
                    position2DescMap.put(start + "_" + end + "_" + strand, attributes.get("product"));

                if (attributes.containsKey("pseudo"))
                    position2DescMap.put(start + "_" + end + "_" + strand, "pseudo");

                if (attributes.containsKey("gene_biotype"))
                    position2DescMap.put(start + "_" + end + "_" + strand, attributes.get("gene_biotype"));

                //create gene
                if (type.equalsIgnoreCase("gene"))
                    res.add(new Gene(source, source, id, type, start, end, strand, desc, idAsParent));
            }
            if (!foundID)
                out.println(filename + "\nOutput ID was not set or could not be found in annotation file. Please check.\nFor the run, locus start-end will be used as ID.");

            r.close();

            //check if outputID is available in attributes, maybe wrong written oder not given
		/*if(!attributes.containsKey(outputID) || outputID.equals(""))
			System.out.println("Please check for output ID!   ");
		*/
            //set descriptions
            for (Gene g : res)
                if (locusTag2DescMap.containsKey(g.getId())) {
                    g.setDescription(locusTag2DescMap.get(g.getId()));
                    //System.out.println("gene: " + g.type + " parent: " + g.idAsParent + " description1: " + g.getDescription());

                } else if (parentId2DescMap.containsKey(g.getIdAsParent())) {
                    g.setDescription(parentId2DescMap.get(g.getIdAsParent()));
                    //System.out.println("description2: " + g.getDescription());

                } else if (position2DescMap.containsKey(g.getStart() + "_" + g.getEnd() + "_" + g.getStrand())) {
                    g.setDescription(position2DescMap.get(g.getStart() + "_" + g.getEnd() + "_" + g.getStrand()));
                    //System.out.println("description3: " + g.getDescription());

                }
        } catch (Throwable e) {
            throw new Exception("A problem occured while parsing the GFF annotation:\n" + filename + "\n" + e.toString(), e);
        }

        return res;
    }

    public static void writeGFF(List<Gene> genes, String filename) throws IOException {
        BufferedWriter bw = new BufferedWriter(new FileWriter(filename));

        bw.write("##gff-version 3\n");

        for (Gene g : genes)
            bw.write(g.toGFFString() + "\n");

        bw.close();
    }
}
