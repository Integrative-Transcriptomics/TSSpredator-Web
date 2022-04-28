
package fasta.ioNew;
import utils.ioNew.EGeneIdentifier;

import java.util.*;

/**
 * FASTAMerger
 *
 * Merges the content of a multiple FASTA-file
 * into one super-contig and provides a mapper
 * the describes the super-contig position and links
 * it to the original contig and position.
 *
 * Description:
 *
 * @author fillinger
 * @version 0.2
 *          Date: 12/7/15
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class FASTAMerger {

    private ArrayList<String> contigName;

    /**
     * Record of the FASTA entries with contigID:sequence
     */
    private LinkedHashMap<String, String> fastaEntries = new LinkedHashMap<>();

    /**
     * The merged sequence from the multi-FASTA file
     */
    private String concatenatedSequence = "";

    /**
     * The map between merged sequence position and original position
     * in the contig. Pair is originalSequencePos:contigID
     */
    private List<Integer> contigPosition = new ArrayList<>();


    /**
     * Hide the constructor from the outside world
     */
    private FASTAMerger(){}

    /**
     * Get the current instance of the class
     * @return FASTAMerger
     */
    public static FASTAMerger getInstance(){
        return new FASTAMerger();
    }

    /**
     * Expects a multi-FASTA file and concats the sequences of all entries.
     * @param fastaFile path to the multi-fasta file
     * @param identifier The type of identifier used
     * @return this
     * @throws FASTAParserException If the parsing fails, an exception is thrown.
     */
    /*public FASTAMerger mergeFASTAs(String fastaFile, EGeneIdentifier identifier) throws FASTAParserException, FASTAMergeException{

        try{
            this.fastaEntries = FASTAParser.parseDNA(fastaFile, identifier);
        } catch (Exception e){
            throw new FASTAParserException(e);
        }
        return mergeFASTAs(this.fastaEntries);
    }*/
    
    public FASTAMerger mergeFASTAsNew(String fastaFile, String identifier) throws FASTAParserException, FASTAMergeException{

        try{
            this.fastaEntries = FASTAParser.parseDNANew(fastaFile, identifier);
        } catch (Exception e){
            throw new FASTAParserException(e);
        }
        return mergeFASTAsNew(this.fastaEntries);
    }

    /**
     * Overloaded mergeFASTA()-method. Can merge a map of FASTA entries.
     * @param fastaEntries A LinkedHashMap of FASTA-entries
     * @return this
     */
/*    public FASTAMerger mergeFASTAs(LinkedHashMap<String, String> fastaEntries) throws FASTAParserException, FASTAMergeException{

        StringBuilder concatenatedSequence = new StringBuilder();

        if(fastaEntries == null ||fastaEntries.size() == 0) {
            throw new FASTAMergeException("Empty list of FASTA entries or null");
        }

        this.fastaEntries = fastaEntries;

        this.fastaEntries.forEach((key, value) -> concatenatedSequence.append(value));
        this.concatenatedSequence = concatenatedSequence.toString();

        return this;
    }*/
    
    public FASTAMerger mergeFASTAsNew(LinkedHashMap<String, String> fastaEntries) throws FASTAParserException, FASTAMergeException{

        StringBuilder concatenatedSequence = new StringBuilder();

        if(fastaEntries == null ||fastaEntries.size() == 0) {
            throw new FASTAMergeException("Empty list of FASTA entries or null");
        }

        this.fastaEntries = fastaEntries;

        this.fastaEntries.forEach((key, value) -> concatenatedSequence.append(value));
        this.concatenatedSequence = concatenatedSequence.toString();

        return this;
    }

    /**
     * Creates the mapping from the super-contig to the original position
     * in each contig
     * @return this
     */
    public FASTAMerger buildMappingToSuperContig(){
        int entryPosition = 0;
        for(Map.Entry<String, String> entry : this.fastaEntries.entrySet()){
            int sequencePosition = 1;
            for(Character nucleotide : entry.getValue().toString().toCharArray()){
                this.contigPosition.add(sequencePosition);
                this.contigPosition.add(entryPosition);
                //this.contigPosition.add(new Pair<>(sequencePosition, entry.getKey()));
                sequencePosition++;
            }
            entryPosition++;

        }
        return this;
    }


    /**
     * Request the FASTA-entries with ID:sequence
     * @return HashMap ID:sequence
     */
    public LinkedHashMap<String, String> getFASTAEntries(){return this.fastaEntries;}


    /**
     * Request the super-contig (merged contigs)
     * @return sequence of the super-contig
     */
    public String getConcatenatedSequence(){return this.concatenatedSequence;}


    /**
     * Request the super-contig mapping
     * @return pair of originalSequencePos:contigID
     */
    public List<Integer> getSuperContigMapper(){return this.contigPosition;}

}
