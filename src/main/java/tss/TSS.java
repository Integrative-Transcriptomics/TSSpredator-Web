
package tss;

import genomic.Gene;

import java.util.*;

import contighandlerNew.MultiContigHandler;
import main.Parameters;
import utils.*;


public class TSS implements Comparable<TSS> {
    int pos;
    //String id;
    char strand;

    //classes
    Gene UTRgene;
    List<Gene> internalGenes;
    List<Gene> antisenseGenes;


    boolean primary;
    boolean secondary;
    boolean internal;
    boolean antisense;
    String antisenseOrientation;

    double height = 0;
    double strictHeight = 0;
    double enrichFactor = 0;
    double cliffFactor = 0;

    public Set<String> mappingSet;
    public Set<String> detectionSet;
    public Set<String> enrichmentSet;

    public Map<String, TSS> gTssMap;

    // replicate specific statistics
    public double[] repHeights;
    public double[] repStepFactors;
    public double[] repEnrich;

    private ITssState primaryOrSecondaryState;
    private ITssState antisenseState;
    private ITssState otherState;


//	public TSS(int pos, char strand)
//	{
//		//this.id = id;
//		this.pos = pos;
//		this.strand = strand;
//	}

    public TSS(int pos, char strand, double height, double strictHeight, double enrichFactor, double cliffFactor) {
        //this.id = id;
        this.pos = pos;
        this.strand = strand;

        this.height = height;
        this.strictHeight = strictHeight;
        this.enrichFactor = enrichFactor;
        this.cliffFactor = cliffFactor;

        primary = false;
        secondary = false;
        internal = false;
        antisense = false;
        antisenseOrientation = "NA";

        mappingSet = new HashSet<String>();
        detectionSet = new HashSet<String>();
        enrichmentSet = new HashSet<String>();
        gTssMap = new HashMap<String, TSS>();

        // replicate specific statistics
        repHeights = new double[Parameters.numReplicates];
        repStepFactors = new double[Parameters.numReplicates];
        repEnrich = new double[Parameters.numReplicates];

        // A Set of ITssStates
        primaryOrSecondaryState = new PrimarySecondaryState(this);
        antisenseState = new AntiSenseState(this);
        otherState = new OtherState();

    }


    /**
     * Determines the UTR length of this TSS and the UTR gene.
     *
     * @param gene the other sequence feature
     * @return the distance between the two sequence features
     */
    public int utrDistanceTo(Gene gene) {
        int res;
        if (this.getPos() <= gene.getEnd() && this.getPos() >= gene.getStart()) {
            res = 0;
        } else {
            res = Math.min(Math.abs(gene.getStart() - this.getPos()), Math.abs(this.getPos() - gene.getEnd()));
        }
        return res;
    }

    public String toString() {
        return (pos + "\t" + strand);
    }

    public String toGFFString(String genomeID) {
        return (genomeID + "\ttssprediction\tTSS\t" + pos + "\t" + pos + "\t.\t" + strand + "\t.");
    }

    public String toGFFtrackString(String genomeID, String trackName) {
        return (genomeID + "\t" + trackName + "\t" + "TSS\t" + pos + "\t" + pos + "\t.\t" + strand + "\t.");
    }

    public int getPos() {
        return pos;
    }

//	public String getId() {
//		return id;
//	}

    public void setPos(int pos) {
        this.pos = pos;
    }


    public char getStrand() {
        return strand;
    }

    public double getHeight() {
        return height;
    }

    public double getStrictHeight() {
        return strictHeight;
    }

    public double getEnrichFactor() {
        return enrichFactor;
    }

    public double getCliffFactor() {
        return cliffFactor;
    }

    public void setNewScores(double newHeight, double newStrictHeight, double newEnrichFactor, double newCliffFactor) {
        this.height = newHeight;
        this.strictHeight = newStrictHeight;
        this.enrichFactor = newEnrichFactor;
        this.cliffFactor = newCliffFactor;
    }

    public void setMaxScores(double newHeight, double newStrictHeight, double newEnrichFactor, double newCliffFactor) {
        this.height = Math.max(this.height, newHeight);
        this.strictHeight = Math.max(this.strictHeight, newStrictHeight);
        this.enrichFactor = Math.max(this.enrichFactor, newEnrichFactor);
        this.cliffFactor = Math.max(this.cliffFactor, newCliffFactor);

        // TODO: make decicion, which position should be taken, based on number of
        // higher values
    }

    public void setPrimary(Gene utrgene) {
        this.primary = true;
        this.secondary = false;
        this.UTRgene = utrgene;
    }

    public void setSecondary(Gene utrgGene) {
        this.secondary = true;
        this.primary = false;
        this.UTRgene = utrgGene;
    }

    public void addInternalGene(Gene internalgene) {
        if (this.internalGenes == null) {
            this.internal = true;
            this.internalGenes = new LinkedList<Gene>();
        }
        this.internalGenes.add(internalgene);
    }

    public void addAntisenseGene(Gene antisensegene) {
        if (this.antisenseGenes == null) {
            this.antisense = true;
            this.antisenseGenes = new LinkedList<Gene>();
        }
        this.antisenseGenes.add(antisensegene);
    }


    public ITssState getPrimaryOrSecondaryState() {
        return this.primaryOrSecondaryState;
    }

    public ITssState getAntisenseState() {
        return this.antisenseState;
    }

    public ITssState getOtherState() {
        return this.otherState;
    }

    @Override
    public int compareTo(TSS o) {
        return this.pos - o.getPos();
    }

    public Gene getUTRgene() {
        return UTRgene;
    }

    public List<Gene> getInternalGenes() {
        return internalGenes;
    }

    public List<Gene> getAntisenseGenes() {
        return antisenseGenes;
    }

    public boolean isPrimary() {
        return primary;
    }

    public boolean isSecondary() {
        return secondary;
    }

    public boolean isInternal() {
        return internal;
    }

    public boolean isAntisense() {
        return antisense;
    }

    public String getAntisenseOrientation() {
        return antisenseOrientation;
    }

    public int getNumClasses() {
        int count = 0;

        if (isPrimary())
            count++;

        if (isSecondary())
            count++;

        if (isInternal())
            count++;

        if (isAntisense())
            count++;

        if (count == 0)
            count++;

        return count;
    }

    public void addMapping(String genomeID) {
        mappingSet.add(genomeID);
    }

    public void addDetection(String genomeID) {
        detectionSet.add(genomeID);
        mappingSet.add(genomeID);
    }

    public void addEnrichment(String genomeID) {
        enrichmentSet.add(genomeID);
    }

    public void addGenomicTSS(String genomeID, TSS tss) {
        this.gTssMap.put(genomeID, tss);
    }

    public boolean isMapped(String genomeID) {
        return mappingSet.contains(genomeID);
    }

    public boolean isDetected(String genomeID) {
        return detectionSet.contains(genomeID);
    }

    public boolean isEnriched(String genomeID) {
        return enrichmentSet.contains(genomeID);
    }

    public boolean isProcessed(String genomeID) {
        if (isEnriched(genomeID) || !isDetected(genomeID))
            return false;

        return gTssMap.get(genomeID).getEnrichFactor() < 1 / Parameters.maxNormalTo5primeFactor;
    }

    public TSS getGenomicTSS(String genomeID) {
        return this.gTssMap.get(genomeID);
    }

    public Set<String> getMappingSet() {
        return mappingSet;
    }


    public Set<String> getDetectionSet() {
        return detectionSet;
    }

    public String getSequence(String genome, int upstream, int downstream) {
        String res;

        try {
            if (this.strand == '-')
                res = genome.substring((pos - 1) - downstream, (pos - 1) + upstream + 1);
            else
                res = genome.substring((pos - 1) - upstream, (pos - 1) + downstream + 1);

            if (this.strand == '-')
                res = reverseComplementDNA(res);
        } catch (StringIndexOutOfBoundsException e) {
            System.err.println("Cannot get upstream sequence for a TSS. Out of genome borders.");
            res = "NA";
        }

        return res;
    }

    private static String reverseComplementDNA(String dna) {
        if (dna == null) return null;

        StringBuffer res = new StringBuffer(dna.length());
        char tmpChar;
        char complChar;

        for (int i = dna.length() - 1; i >= 0; i--) {
            tmpChar = dna.charAt(i);

            switch (tmpChar) {
                case 'A':
                    complChar = 'T';
                    break;
                case 'a':
                    complChar = 't';
                    break;
                case 'T':
                    complChar = 'A';
                    break;
                case 't':
                    complChar = 'a';
                    break;
                case 'G':
                    complChar = 'C';
                    break;
                case 'g':
                    complChar = 'c';
                    break;
                case 'C':
                    complChar = 'G';
                    break;
                case 'c':
                    complChar = 'g';
                    break;
                case 'N':
                    complChar = 'N';
                    break;
                case 'n':
                    complChar = 'n';
                    break;
                default:
                    complChar = 'N';
                    System.err.println("Cannot create reverse complement!");
            }
            res.append(complChar);
        }

        return res.toString();
    }


    public Set<String> getEnrichmentSet() {
        return enrichmentSet;
    }

    public int getNumOfNotProcessedDetections() {
        int res = detectionSet.size();
        for (String id : detectionSet)
            if (isProcessed(id))
                res--;
        return res;
    }

    public String getPosHashString() {
        return Integer.toString(this.pos) + this.strand;
    }


    ///further classification of antisense

    public void setOrientation(Gene gene) {
        int startG = gene.getStart();
        int endG = gene.getEnd();

        if (this.getPos() > startG && this.getPos() < endG) {
            //System.out.println("in gene");
            //System.out.println(gene.getId());
            this.antisenseOrientation = "in gene";
        } else if (gene.getStrand() == '+') {
            if (this.getPos() < startG) {
                //System.out.println("head-to-head");
                //System.out.println(gene.getId());
                this.antisenseOrientation = "h-h";
            } else {
                //System.out.println("tail-to-tail");
                //System.out.println(gene.getId());
                this.antisenseOrientation = "t-t";
            }
        } else //if strand not +, than it is -
            if (this.getPos() < startG) {
                //System.out.println("tail-to-tail");
                //System.out.println(gene.getId());
                this.antisenseOrientation = "t-t";
            } else {
                //System.out.println("head-to-head");
                //System.out.println(gene.getId());
                this.antisenseOrientation = "h-h";
            }
    }

}
