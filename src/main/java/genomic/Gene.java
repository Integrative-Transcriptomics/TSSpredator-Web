
package genomic;

import java.util.LinkedList;
import java.util.List;
import java.util.Set;

import tss.TSS;


public class Gene {
    String id;
    int start;
    int end;
    char strand;
    String description;
    String type;
    String source;
    String origin;
    String idAsParent;
    String note;

    List<TSS> utrTsss;

    public String corrected;

    public Gene(String source, String origin, String id, String type, int start, int end, char strand, String description) {
        super();
        this.source = source;
        this.origin = origin;
        this.id = id;
        this.type = type;
        this.start = start;
        this.end = end;
        this.strand = strand;
        this.description = description;
        utrTsss = new LinkedList<TSS>();
    }

    public Gene(String source, String origin, String id, String type, int start, int end, char strand, String description, String idAsParent) {
        this(source, origin, id, type, start, end, strand, description);
        this.idAsParent = idAsParent;
    }

    public String getId() {
        return id;
    }

    public String getIdAsParent() {
        return idAsParent;
    }

    public int getStart() {
        return start;
    }

    public void adjustStartPos(int offset) {
        this.start += offset;
    }

    public void adjustEndPos(int offset) {
        this.end += offset;
    }

    public int getEnd() {
        return end;
    }

    public void setStart(int start) {
        this.start = start;
    }

    public void setEnd(int end) {
        this.end = end;
    }

    public char getStrand() {
        return strand;
    }

    public void changeOrigin(String newOrigin) {
        this.origin = newOrigin;
    }

    public int getLength() {
        return end - start + 1;
    }

    public String getDescription() {
        return (description);
		
		/*/manual modification for correction column
		if(corrected==null)
			return "\t"+description;
		else
			return corrected+"\t"+description;
		//*/
    }


    public void addUTRtss(TSS tss) {
        utrTsss.add(tss);
    }

    public void classifyUTRtsss() {
        if (this.utrTsss.size() == 0)
            return;

        TSS best = this.utrTsss.get(0);

        for (TSS tss : utrTsss)
            if (tss.getHeight() > best.getHeight())
                best = tss;

//		for(TSS tss : utrTsss)
//			if(tss.distanceTo(this)<best.distanceTo(this))
//				best=tss;

        best.setPrimary(this);
    }

    public String getType() {
        return type;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String toGFFString() {
        String res = source + "\t" + origin + "\t" + type + "\t" + start + "\t" + end + "\t" + "." + "\t" + strand + "\t" + "." + "\t" + "locus_tag=" + id;

        //System.out.println("desc: " + description);
        if (description.length() != 0)
            res = res + ";product=" + description;

        if (note != null)
            res = res + ";Note=" + note;

        return res;
    }

    public String getOrigin() {
        return origin;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public int[] getOverlapStartEnd(Gene gene) {
        int oStart = Math.max(this.getStart(), gene.getStart());
        int oEnd = Math.min(this.getEnd(), gene.getEnd());

        //no overlap
        if (oEnd < oStart) {
            return null; //getNumOverlappingBases and maybe other functions depend on this!
        }

        int[] res = {oStart, oEnd};

        return res;
    }

    public int getNumOverlappingBases(Gene gene) {
        int[] ov = getOverlapStartEnd(gene);

        if (ov == null)
            return 0;

        return ov[1] - ov[0] + 1;
    }

    public String get_sRNA_asRNA_labelIfContainedInSet(Set<String> sRNAnameList, Set<String> asRNAnameList) {
        if (sRNAnameList.contains(id) && asRNAnameList.contains(id))
            return "sRNA/asRNA";
        if (sRNAnameList.contains(id))
            return "sRNA";
        if (asRNAnameList.contains(id))
            return "asRNA";
        else
            return "";
    }


}
